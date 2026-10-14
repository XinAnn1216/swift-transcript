import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/components/RequireAuth";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function AppPage() {
  usePageMeta("Dashboard — Video Speed Reader", "Your Video Speed Reader dashboard.");
  const user = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-lg font-bold tracking-tight">Video Speed Reader</Link>
        <Button variant="outline" onClick={signOut}>Sign out / 登出</Button>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-24 text-center animate-fade-up">
        <h1 className="text-3xl font-bold sm:text-4xl">Hi {user.email}</h1>
        <p className="mt-4 text-lg">
          你的逐字稿儀表板即將上線 — 下一個里程碑會加上上傳影片的功能。
        </p>
        <p className="mt-2 text-muted-foreground">
          Your dashboard is coming soon. Upload functionality will be added in the next milestone.
        </p>
      </main>
    </div>
  );
}
