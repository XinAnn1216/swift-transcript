import { AppHeader } from "@/components/AppHeader";

export default function AppView({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-hero-glow">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-24 text-center animate-fade-up">
        <h1 className="text-3xl font-bold sm:text-4xl">Hi {email}</h1>
        <p className="mt-4 text-lg">
          你的逐字稿儀表板即將上線 — 現在可以到「上傳影片」送出影片 URL 產生逐字稿。
        </p>
        <p className="mt-2 text-muted-foreground">
          Your dashboard is coming soon. For now, head to Upload to transcribe a video URL.
        </p>
      </main>
    </div>
  );
}
