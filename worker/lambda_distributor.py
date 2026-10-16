"""
M4 distributor: an AWS Lambda fired every minute by EventBridge. Replaces the
EC2 distributor.py loop. For each pending job whose session has no Fargate task
yet, it launches one ECS Fargate task running worker.py, then stamps the task
ARN on job_sessions.fargate_task_arn so later ticks skip it.

Secrets come from AWS Secrets Manager (the Lambda role may read exactly the
three app secrets) and are handed to the task as env overrides, so the worker
task role needs no AWS permissions.

Config env: ECS_CLUSTER, TASK_DEFINITION, SUBNETS, SECURITY_GROUPS (comma lists).
Only the spawn pass is implemented; stuck-job recovery and cleanup are future work.
"""
import os

import boto3
from supabase import create_client

ecs = boto3.client("ecs")
sm = boto3.client("secretsmanager")

SECRET_NAMES = {
    "OPENAI_API_KEY": "openai-api-key",
    "SUPABASE_URL": "supabase-url",
    "SUPABASE_SECRET_KEY": "supabase-secret-key",
}
_secrets = {k: sm.get_secret_value(SecretId=v)["SecretString"] for k, v in SECRET_NAMES.items()}
db = create_client(_secrets["SUPABASE_URL"], _secrets["SUPABASE_SECRET_KEY"])


def _split(name: str) -> list[str]:
    return [s for s in os.environ.get(name, "").split(",") if s]


def _ensure_session(job: dict) -> dict:
    """Return the job's current session, creating and linking one if missing."""
    if job.get("current_session_id"):
        return db.table("job_sessions").select("id, fargate_task_arn") \
            .eq("id", job["current_session_id"]).single().execute().data
    row = db.table("job_sessions").insert(
        {"job_id": job["id"], "session_number": 1}).execute().data[0]
    # A direct-INSERT job has no link; worker.py crashes on a null current_session_id.
    db.table("jobs").update({"current_session_id": row["id"]}).eq("id", job["id"]).execute()
    return {"id": row["id"], "fargate_task_arn": None}


def _run_task(job_id: str) -> str:
    env = [{"name": "JOB_ID", "value": job_id}] + [
        {"name": k, "value": v} for k, v in _secrets.items()
    ]
    resp = ecs.run_task(
        cluster=os.environ["ECS_CLUSTER"],
        taskDefinition=os.environ["TASK_DEFINITION"],
        launchType="FARGATE",
        count=1,
        networkConfiguration={"awsvpcConfiguration": {
            "subnets": _split("SUBNETS"),
            "securityGroups": _split("SECURITY_GROUPS"),
            "assignPublicIp": "ENABLED",
        }},
        overrides={"containerOverrides": [{"name": "worker", "environment": env}]},
        startedBy=f"job-{job_id}"[:36],
    )
    if resp.get("failures") or not resp.get("tasks"):
        raise RuntimeError(f"run_task failed: {resp.get('failures')}")
    return resp["tasks"][0]["taskArn"]


def handler(event, context):
    jobs = db.table("jobs").select("id, current_session_id").eq("status", "pending").execute().data
    spawned = []
    for job in jobs:
        try:
            session = _ensure_session(job)
            if session.get("fargate_task_arn"):
                continue
            arn = _run_task(job["id"])
            db.table("job_sessions").update({"fargate_task_arn": arn}).eq("id", session["id"]).execute()
            spawned.append({"job_id": job["id"], "task_arn": arn})
            print(f"spawned Fargate task for job {job['id']}: {arn}", flush=True)
        except Exception as e:
            print(f"job {job['id']}: {e}", flush=True)
    return {"pending": len(jobs), "spawned": spawned}
