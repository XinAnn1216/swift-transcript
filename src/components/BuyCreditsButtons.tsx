"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export type CreditTier = {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  bonusPct: number;
};

export function BuyCreditsButtons({ tiers }: { tiers: CreditTier[] }) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(productId: string) {
    setError(null);
    setPurchasingId(productId);
    const res = await fetch("/api/credits/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    if (!res?.ok || !body?.url) {
      setPurchasingId(null);
      return setError(body?.error ?? "Checkout failed. Please try again.");
    }
    window.location.href = body.url;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex flex-col rounded-2xl border bg-card p-6 shadow-glow">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-semibold">{tier.name}</h3>
              {tier.bonusPct > 0 && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                  +{tier.bonusPct}%
                </span>
              )}
            </div>
            <p className="mt-3 text-3xl font-bold">${tier.price_usd.toFixed(2)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              ${(tier.price_usd / tier.credits).toFixed(3)} / credit · {tier.credits} min of video
            </p>
            <Button
              className="mt-6 w-full"
              disabled={purchasingId !== null}
              onClick={() => buy(tier.id)}
            >
              {purchasingId === tier.id ? "Redirecting…" : "Buy / 購買"}
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
