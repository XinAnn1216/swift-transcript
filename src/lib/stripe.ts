import Stripe from "stripe";

// Server-only. Created lazily so a missing key fails the request that needs it,
// not the whole build.
let client: Stripe | null = null;

export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  }
  return client;
}
