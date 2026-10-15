"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("zh");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_source_url: url, topic, language }),
    }).catch(() => null);
    setLoading(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      return setError(body?.error ?? "Something went wrong. Please try again.");
    }
    setUrl("");
    setTopic("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-8 shadow-glow">
      <div>
        <h2 className="text-2xl font-semibold">送出影片 Submit a video</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          YouTube links are not supported yet. Use a direct mp4 / mp3 link.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">Video URL</Label>
        <Input
          id="url"
          type="url"
          required
          placeholder="Direct mp4 / mp3 URL (e.g. CloudFront, Vimeo, Internet Archive)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">Topic (optional)</Label>
        <Input
          id="topic"
          placeholder="e.g. Tech podcast — useful context for the model"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="zh">中文 zh</option>
          <option value="en">English en</option>
          <option value="ja">日本語 ja</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "..." : "Transcribe"}
      </Button>
    </form>
  );
}
