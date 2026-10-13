import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Video Speed Reader" },
      { name: "description", content: "Your Video Speed Reader dashboard." },
      { property: "og:title", content: "Dashboard — Video Speed Reader" },
      { property: "og:description", content: "Your Video Speed Reader dashboard." },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/signin", replace: true });
  }

  return (
    <div className="min-h-screen bg-hero-glow">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-lg font-bold tracking-tight">Video Speed Reader</Link>
        <Button variant="outline" onClick={signOut}>Sign out / 登出</Button>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-24 text-center animate-fade-up">
        <h1 className="text-3xl font-bold sm:text-4xl">Hi {user.email}</h1>
        <p className="mt-4 text-muted-foreground">
          Your dashboard is coming soon. Upload functionality will be added in the next milestone.
        </p>
      </main>
    </div>
  );
}
