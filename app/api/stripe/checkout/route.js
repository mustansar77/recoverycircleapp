import { NextResponse } from "next/server";
import { stripe, KARMA_RATE, SUBSCRIPTION_PLANS } from "@/lib/stripe/client";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, planPrice, karmaBundles } = await request.json();
    const base = process.env.NEXT_PUBLIC_APP_URL;

    // ── Subscription (user → guide) ─────────────────────────────────────────
    if (type === "subscription") {
      const plan = SUBSCRIPTION_PLANS[0]; // single $20/month plan
      if (!plan.priceId) return NextResponse.json({ error: "Subscription not configured" }, { status: 500 });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: plan.priceId, quantity: 1 }],
        metadata: { userId: user.id, type: "subscription", planPrice: String(plan.price), coins: String(plan.coins) },
        success_url: `${base}/user/certification?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${base}/user/certification`,
      });

      return NextResponse.json({ url: session.url });
    }

    // ── KarmaCoin purchase ───────────────────────────────────────────────────
    if (type === "karma") {
      const quantity = Math.max(1, Math.floor(Number(karmaBundles)));
      const coins    = quantity * KARMA_RATE.coins;

      // Redirect to the correct home page based on role
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const roleHome = { guide: "/guide", superadmin: "/superadmin", admin: "/admin" }[profile?.role] ?? "/user";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: KARMA_RATE.usd * 100,
            product_data: { name: `${KARMA_RATE.coins} KarmaCoins`, description: "RecoveryCircle in-app currency" },
          },
          quantity,
        }],
        metadata: { userId: user.id, type: "karma", coins: String(coins) },
        success_url: `${base}${roleHome}?karma=success&coins=${coins}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${base}${roleHome}`,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Checkout failed" },
      { status: 500 }
    );
  }
}
