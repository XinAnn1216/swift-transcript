import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  // 1. Authenticate the caller via the cookie session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.video_source_url) {
    return NextResponse.json({ error: "video_source_url required" }, { status: 400 });
  }

  // 2. Fast credit floor. The worker does the precise minutes-vs-balance check
  // once it knows the video's duration.
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || Number(profile.credits_balance) < 1) {
    return NextResponse.json(
      { error: "insufficient credits — please buy more at /credits" },
      { status: 402 },
    );
  }

  // 3. Use the Supabase Secret key to insert the job + session rows.
  // The user has already been authenticated above; the Secret key bypasses RLS
  // so we can insert in one round-trip without policy ping-pong.
  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .insert({
      user_id: user.id,
      video_source_url: body.video_source_url,
      topic: body.topic || null,
      language: body.language ?? "zh",
      status: "pending",
    })
    .select()
    .single();
  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 });
  }

  const { data: session, error: sessErr } = await admin
    .from("job_sessions")
    .insert({ job_id: job.id, session_number: 1 })
    .select()
    .single();
  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }

  await admin.from("jobs").update({ current_session_id: session.id }).eq("id", job.id);

  return NextResponse.json({ job_id: job.id });
}
