"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

// UX only: the webhook grants the credits. This polls the balance for a short
// while so the new total shows up as soon as the webhook has landed.
export function PurchaseStatus({ startBalance, credited }: { startBalance: number; credited: boolean }) {
  const router = useRouter();
  const [balance, setBalance] = useState(startBalance);
  const [settled, setSettled] = useState(credited);

  useEffect(() => {
    if (credited) return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const res = await fetch("/api/credits/balance", { cache: "no-store" }).catch(() => null);
      const body = await res?.json().catch(() => null);
      const next = Number(body?.credits_balance);
      if (Number.isFinite(next) && next !== startBalance) {
        setBalance(next);
        setSettled(true);
        clearInterval(timer);
        router.refresh();
      } else if (tries >= 10) {
        setSettled(true);
        clearInterval(timer);
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [startBalance, credited, router]);

  return (
    <div className="space-y-4">
      <p className="text-5xl font-bold">{balance} credits</p>
      <p className="text-muted-foreground">
        {settled
          ? credited || balance !== startBalance
            ? "Your credits have been added. 點數已入帳。"
            : "Payment received. Credits may take a minute to appear. 付款完成，點數入帳可能需要一點時間。"
          : "Confirming your payment… 正在確認付款…"}
      </p>
      <div className="flex gap-3">
        <Link href="/upload" className={buttonVariants({})}>Transcribe a video</Link>
        <Link href="/credits" className={buttonVariants({ variant: "outline" })}>Back to credits</Link>
      </div>
    </div>
  );
}
