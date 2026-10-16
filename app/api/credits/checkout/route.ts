import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  // RLS only returns active products to signed-in users.
  const { data: product } = await supabase
    .from("credit_products")
    .select("id, name, credits, stripe_price_id")
    .eq("id", body.product_id)
    .eq("active", true)
    .maybeSingle();
  if (!product?.stripe_price_id) {
    return NextResponse.json({ error: "unknown product" }, { status: 400 });
  }

  // Build return URLs from the request origin so the same code works on the
  // vercel.app URL today and a custom domain later.
  const origin =
    req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits?canceled=1`,
      client_reference_id: user.id,
      ...(user.email ? { customer_email: user.email } : {}),
      metadata: {
        user_id: user.id,
        product_id: product.id,
        credits: String(product.credits),
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout session create failed", err);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
