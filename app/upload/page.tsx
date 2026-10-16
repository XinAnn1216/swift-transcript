import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { UploadForm } from "@/components/UploadForm";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Upload — Video Speed Reader",
  description: "Submit a video URL and get its transcript.",
};

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  downloading: "bg-muted text-muted-foreground",
  transcribe: "bg-accent text-accent-foreground",
  done: "bg-secondary text-secondary-foreground",
  insufficient_credits: "bg-destructive/10 text-destructive",
  error: "bg-destructive/10 text-destructive",
};

function truncate(text: string, max = 50) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // RLS limits this to the signed-in user's rows; the filter makes it explicit.
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, created_at, video_source_url, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-hero-glow">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-10 px-6 py-12 animate-fade-up">
        <section className="rounded-2xl border bg-card p-8">
          <h1 className="text-3xl font-bold">你的逐字稿 Your transcriptions</h1>
          {!jobs?.length ? (
            <p className="mt-4 text-muted-foreground">
              No transcriptions yet. Submit your first video below.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Created</th>
                    <th className="py-2 pr-4 font-medium">URL</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Transcript</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap py-3 pr-4">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-3 pr-4" title={job.video_source_url}>
                        {truncate(job.video_source_url)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            statusStyles[job.status] ?? statusStyles["pending"],
                          )}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {job.status === "insufficient_credits" ? (
                          <a href="/credits" className="font-medium text-primary hover:underline">
                            Buy credits
                          </a>
                        ) : job.status === "done" ? (
                          <a
                            href={`/api/jobs/${job.id}/transcript`}
                            download={`transcript-${job.id.slice(0, 8)}.txt`}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <Download className="h-4 w-4" />
                            .txt
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <UploadForm />
      </main>
    </div>
  );
}
