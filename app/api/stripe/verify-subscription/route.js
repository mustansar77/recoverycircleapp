import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { session_id } = await request.json();
    if (!session_id) return NextResponse.json({ error: "session_id required" }, { status: 400 });

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
    }
    if (session.metadata?.type !== "subscription") {
      return NextResponse.json({ error: "Not a subscription session" }, { status: 400 });
    }

    const admin  = getAdminClient();
    const coins  = Number(session.metadata.coins ?? 22);
    const planPrice = Number(session.metadata.planPrice ?? 20);

    // Idempotency — check if already credited via wallet_transactions
    const { data: existing } = await admin
      .from("wallet_transactions")
      .select("id")
      .eq("reference_id", session_id)
      .eq("source", "subscription")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ already_credited: true, coins });
    }

    // Upsert subscription record
    await admin.from("subscriptions").upsert({
      user_id:                user.id,
      stripe_subscription_id: session.subscription,
      tier:                   planPrice,
      status:                 "active",
    }, { onConflict: "user_id" });

    // Credit the KarmaCoins
    const { data: profile } = await admin
      .from("profiles")
      .select("karma_coins")
      .eq("id", user.id)
      .single();

    await admin
      .from("profiles")
      .update({ karma_coins: (profile?.karma_coins ?? 0) + coins })
      .eq("id", user.id);

    await admin.from("wallet_transactions").insert({
      user_id:      user.id,
      amount:       coins,
      type:         "credit",
      source:       "subscription",
      reference_id: session_id,
      description:  `Subscribed — ${coins} KarmaCoins credited`,
    });

    return NextResponse.json({ credited: true, coins });
  } catch (err) {
    console.error("verify-subscription error:", err);
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
