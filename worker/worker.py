"""
M1 worker: processes one job, downloads the video, runs Whisper,
writes TXT back to job_sessions.subtitle_txt_content.

Started by distributor.py (one Popen per pending job). Reads JOB_ID from env.
Reads OPENAI_API_KEY / SUPABASE_URL / SUPABASE_SECRET_KEY from AWS Secrets
Manager — the EC2's IAM instance profile grants `secretsmanager:GetSecretValue`
on exactly those secret names, so no credentials ever live on disk.
"""
import os
import math
import time
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import boto3
import openai
from openai import OpenAI
from supabase import create_client


def _get_secret(client, name: str) -> str:
    """Fetch one Secrets Manager secret by name (returns the SecretString)."""
    return client.get_secret_value(SecretId=name)["SecretString"]


def _load_secrets() -> dict[str, str]:
    """Pull the three M1 secrets from AWS Secrets Manager."""
    sm = boto3.client("secretsmanager")
    return {
        "OPENAI_API_KEY": _get_secret(sm, "openai-api-key"),
        "SUPABASE_URL": _get_secret(sm, "supabase-url"),
        "SUPABASE_SECRET_KEY": _get_secret(sm, "supabase-secret-key"),
    }


_secrets = _load_secrets()
db = create_client(_secrets["SUPABASE_URL"], _secrets["SUPABASE_SECRET_KEY"])
openai_client = OpenAI(api_key=_secrets["OPENAI_API_KEY"])

# OpenAI Whisper has a 25 MB file-size limit. 10 minutes of 64 kbps mono mp3 ~= 4.8 MB,
# safely under the limit. Long videos get split into 600-second chunks.
CHUNK_SECONDS = 600
MAX_RETRIES = 4


def get_job(job_id: str) -> dict:
    return db.table("jobs").select("*").eq("id", job_id).single().execute().data


def update_job(job_id: str, **fields) -> None:
    now = datetime.now(timezone.utc).isoformat()
    db.table("jobs").update({**fields, "updated_at": now}).eq("id", job_id).execute()


def update_session(session_id: str, **fields) -> None:
    db.table("job_sessions").update(fields).eq("id", session_id).execute()


def download_video(url: str, dest_dir: Path) -> Path:
    """yt-dlp for URLs; pass through for local file paths. Reuses an earlier download."""
    existing = next(dest_dir.glob("video.*"), None)
    if existing:
        return existing
    if url.startswith(("http://", "https://")):
        out_template = str(dest_dir / "video.%(ext)s")
        subprocess.run(["yt-dlp", "--no-playlist", "--no-progress", "-o", out_template, url], check=True)
        return next(dest_dir.glob("video.*"))
    return Path(url).expanduser().resolve()


def to_mp3(video_path: Path, dest_dir: Path) -> Path:
    """Convert any video/audio container to 64 kbps mono 16 kHz mp3 (Whisper-friendly)."""
    mp3 = dest_dir / "audio.mp3"
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-ac", "1",
            "-ar", "16000", "-ab", "64k",
            "-acodec", "libmp3lame",
            str(mp3),
        ],
        check=True,
        capture_output=True,
    )
    return mp3


def get_duration_seconds(audio_path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(out.stdout.strip())


def split_chunks(mp3_path: Path, dest_dir: Path) -> list[Path]:
    """Split into CHUNK_SECONDS-second chunks (re-encode to keep sizes predictable)."""
    duration = get_duration_seconds(mp3_path)
    n_chunks = max(1, math.ceil(duration / CHUNK_SECONDS))
    chunks = []
    for i in range(n_chunks):
        chunk = dest_dir / f"chunk_{i:03d}.mp3"
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(mp3_path),
                "-ss", str(i * CHUNK_SECONDS),
                "-t", str(CHUNK_SECONDS),
                "-acodec", "libmp3lame",
                "-ab", "64k",
                str(chunk),
            ],
            check=True,
            capture_output=True,
        )
        chunks.append(chunk)
    return chunks


def transcribe_chunk(chunk_path: Path, language: str) -> str:
    """Call Whisper, retrying 429 and 5xx with backoff. Other 4xx errors raise at once."""
    for attempt in range(MAX_RETRIES):
        try:
            with open(chunk_path, "rb") as f:
                return openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=f,
                    response_format="text",
                    language=language,
                )
        except openai.RateLimitError as e:
            # A 429 for exhausted credit will not clear on retry.
            if "insufficient_quota" in str(e):
                raise
        except openai.APIStatusError as e:
            if not 500 <= e.status_code < 600:
                raise
        time.sleep(2 ** attempt)
    raise RuntimeError(f"Whisper failed after {MAX_RETRIES} retries")


def main() -> None:
    job_id = os.environ["JOB_ID"]
    job = get_job(job_id)
    session_id = job["current_session_id"]

    update_job(job_id, status="downloading")
    print(f"[{job_id}] downloading {job['video_source_url']}", flush=True)

    # Per-job working dir, kept after the job ends so a re-run skips the download.
    work_dir = Path("/tmp") / job_id
    work_dir.mkdir(parents=True, exist_ok=True)
    video = download_video(job["video_source_url"], work_dir)
    mp3 = to_mp3(video, work_dir)

    update_job(job_id, status="transcribe")
    chunks = split_chunks(mp3, work_dir)
    print(f"[{job_id}] transcribing {len(chunks)} chunk(s)", flush=True)

    full_text = "\n\n".join(
        transcribe_chunk(c, job["language"]).strip() for c in chunks
    )

    update_session(session_id, subtitle_txt_content=full_text)
    update_job(job_id, status="done")

    print(f"[{job_id}] done — {len(full_text)} chars", flush=True)


if __name__ == "__main__":
    main()
