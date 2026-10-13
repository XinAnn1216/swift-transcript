import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Languages, Timer, BadgeCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Speed Reader — 三分鐘拿到逐字稿" },
      { name: "description", content: "Upload your video, get a clean transcript in three minutes. Powered by OpenAI Whisper." },
      { property: "og:title", content: "Video Speed Reader — 三分鐘拿到逐字稿" },
      { property: "og:description", content: "Upload your video, get a clean transcript in three minutes." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Languages, title: "高準確度逐字稿", en: "High-accuracy transcripts", body: "Powered by OpenAI Whisper, supports Chinese and English." },
  { icon: Timer, title: "三分鐘交付", en: "Three-minute turnaround", body: "Processed in the background — you get an email when it's ready." },
  { icon: BadgeCheck, title: "可商用授權", en: "Commercial-use ready", body: "You own the output. Use it however you like." },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="reveal h-full" style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function Index() {
  return (
    <div className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">Video Speed Reader</span>
        <Link to="/signin" className={buttonVariants({})}>Sign in / 登入</Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-20 text-center sm:pt-32">
        <p className="animate-fade-up mb-6 inline-block rounded-full border bg-card px-4 py-1 text-xs text-muted-foreground">
          For creators, educators & engineers
        </p>
        <h1 className="animate-fade-up text-gradient text-5xl font-extrabold tracking-tight sm:text-7xl" style={{ animationDelay: "80ms" }}>
          Video Speed Reader
        </h1>
        <p className="animate-fade-up mt-6 text-2xl font-semibold sm:text-3xl" style={{ animationDelay: "160ms" }}>
          上傳影片，三分鐘內拿到逐字稿。
        </p>
        <p className="animate-fade-up mt-3 text-lg text-muted-foreground" style={{ animationDelay: "240ms" }}>
          Upload your video, get a clean transcript in three minutes.
        </p>
        <div className="animate-fade-up mt-10 flex justify-center gap-3" style={{ animationDelay: "320ms" }}>
          <Link to="/signup" className={buttonVariants({ size: "lg", className: "shadow-glow" })}>Get started</Link>
          <Link to="/signin" className={buttonVariants({ size: "lg", variant: "outline" })}>Sign in / 登入</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-28 md:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.en} delay={i * 120}>
            <div className="h-full rounded-2xl border bg-card p-8 transition-colors hover:border-primary/50">
              <div className="mb-5 inline-flex rounded-xl bg-accent p-3 text-primary"><f.icon className="h-6 w-6" /></div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.en}</p>
              <p className="mt-4 text-muted-foreground">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 Video Speed Reader</footer>
    </div>
  );
}
