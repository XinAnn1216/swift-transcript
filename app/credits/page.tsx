import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { BuyCreditsButtons, type CreditTier } from "@/components/BuyCreditsButtons";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Credits — Video Speed Reader",
  description: "Your credit balance, credit packs, and history.",
};

const typeStyles: Record<string, string> = {
  purchase: "text-emerald-700",
  signup_bonus: "text-amber-700",
  deduction: "text-muted-foreground",
  admin_grant: "text-primary",
};

const typeLabels: Record<string, string> = {
  purchase: "Purchase 購買",
  signup_bonus: "Signup bonus 註冊贈點",
  deduction: "Usage 使用",
  admin_grant: "Grant 補發",
};

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { canceled } = await searchParams;

  const [{ data: profile }, { data: products }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("credits_balance").eq("id", user.id).maybeSingle(),
    supabase
      .from("credit_products")
      .select("id, name, credits, price_usd")
      .eq("active", true)
      .order("price_usd"),
    supabase
      .from("credit_transactions")
      .select("id, amount, type, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Bonus is measured against the smallest pack's price per credit.
  const list = (products ?? []).map((p) => ({
    ...p,
    credits: Number(p.credits),
    price_usd: Number(p.price_usd),
  }));
  const baseline = [...list].sort((a, b) => a.credits - b.credits)[0];
  const baseRate = baseline ? baseline.price_usd / baseline.credits : 0;
  const tiers: CreditTier[] = list.map((p) => ({
    ...p,
    bonusPct: baseRate ? Math.round((1 - p.price_usd / p.credits / baseRate) * 100) : 0,
  }));

  const balance = Number(profile?.credits_balance ?? 0);

  return (
    <div className="min-h-screen bg-hero-glow">
      <AppHeader />
      <main className="mx-auto max-w-4xl space-y-10 px-6 py-12 animate-fade-up">
        {canceled && (
          <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
            Checkout was canceled. No charge was made. 已取消付款，未扣款。
          </p>
        )}
        <section className="rounded-2xl border bg-card p-8">
          <p className="text-sm font-medium text-muted-foreground">Your balance 你的點數</p>
          <p className="mt-2 text-5xl font-bold">{balance} credits</p>
          <p className="mt-2 text-muted-foreground">1 credit = 1 minute of video · 1 點 = 1 分鐘影片</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Buy credits 購買點數</h2>
          <BuyCreditsButtons tiers={tiers} />
          <p className="text-xs text-muted-foreground">
            Test mode: pay with card 4242 4242 4242 4242, any future date and CVC.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-8">
          <h2 className="text-2xl font-semibold">History 紀錄</h2>
          {!transactions?.length ? (
            <p className="mt-4 text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Description</th>
                    <th className="py-2 text-right font-medium">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const amount = Number(tx.amount);
                    return (
                      <tr key={tx.id} className="border-b last:border-0">
                        <td className="whitespace-nowrap py-3 pr-4">
                          {format(new Date(tx.created_at), "yyyy-MM-dd HH:mm")}
                        </td>
                        <td className={cn("whitespace-nowrap py-3 pr-4 font-medium", typeStyles[tx.type])}>
                          {typeLabels[tx.type] ?? tx.type}
                        </td>
                        <td className="py-3 pr-4">{tx.description}</td>
                        <td className={cn("py-3 text-right font-semibold", typeStyles[tx.type])}>
                          {amount > 0 ? `+${amount}` : amount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
