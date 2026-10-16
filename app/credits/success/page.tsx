import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { PurchaseStatus } from "@/components/PurchaseStatus";

export const metadata: Metadata = {
  title: "Thanks — Video Speed Reader",
};

export default async function CreditsSuccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();

  // If the webhook already landed, the balance is final; the client still polls
  // briefly in case it hasn't.
  const { data: recent } = await supabase
    .from("credit_transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "purchase")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString())
    .limit(1);
  const balance = Number(profile?.credits_balance ?? 0);

  return (
    <div className="min-h-screen bg-hero-glow">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-24 animate-fade-up">
        <section className="rounded-2xl border bg-card p-8">
          <h1 className="text-3xl font-bold">Thank you! 感謝購買</h1>
          <div className="mt-6">
            <PurchaseStatus startBalance={balance} credited={Boolean(recent?.length)} />
          </div>
        </section>
      </main>
    </div>
  );
}
