import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe calls this, not a signed-in user: middleware.ts skips this path and
// we write with the Secret key. The webhook is the only thing that grants
// purchased credits.
export async function POST(req: Request) {
  const body = await req.text(); // raw body: the signature covers these exact bytes
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("no signature", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new NextResponse("webhook not configured", { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return new NextResponse("invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, unpaid: true });
  }

  const userId = session.metadata?.user_id;
  const productId = session.metadata?.product_id;
  const credits = Number(session.metadata?.credits);
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!userId || !productId || !credits || !paymentIntentId) {
    console.error("missing required fields", { userId, productId, credits, paymentIntentId });
    return new NextResponse("missing metadata", { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Ledger row first. The unique index on stripe_payment_intent_id makes a
  // repeated delivery fail with 23505, which we treat as already done.
  const { error: insertErr } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    type: "purchase",
    description: `Purchased ${credits} credits`,
    stripe_payment_intent_id: paymentIntentId,
  });
  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("insert failed", insertErr);
    return new NextResponse("db insert failed", { status: 500 });
  }

  // 2. Balance is derived from the ledger; if this fails it can be rebuilt with
  // SUM(amount) over credit_transactions.
  const { data: profile } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();
  const newBalance = Number(profile?.credits_balance ?? 0) + credits;
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ credits_balance: newBalance })
    .eq("id", userId);
  if (updateErr) {
    console.error("balance update failed", updateErr);
    return new NextResponse("balance update failed", { status: 500 });
  }

  console.log("credited", { userId, credits, paymentIntentId });
  return NextResponse.json({ received: true, credited: credits });
}
