import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function creditKarma(supabaseAdmin, userId, coins, source, referenceId, description) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("karma_coins")
    .eq("id", userId)
    .single();

  await supabaseAdmin
    .from("profiles")
    .update({ karma_coins: (profile?.karma_coins ?? 0) + coins })
    .eq("id", userId);

  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: userId,
    amount: coins,
    type: "credit",
    source,
    reference_id: referenceId,
    description,
  });
}

export async function POST(request) {
  const supabaseAdmin = getAdminClient();
  const body = await request.text();
  const sig  = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // ── One-time KarmaCoin purchase ──────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, type, coins, planPrice } = session.metadata ?? {};

    if (type === "karma") {
      await creditKarma(
        supabaseAdmin, userId, Number(coins),
        "stripe", session.id,
        `Purchased ${coins} KarmaCoins via Stripe`
      );
    }

    if (type === "subscription") {
      // Record the subscription + credit 22 KC — does NOT change role
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: session.subscription,
        tier: Number(planPrice),
        status: "active",
      }, { onConflict: "user_id" });

      await creditKarma(
        supabaseAdmin, userId, Number(coins ?? 22),
        "subscription", session.id,
        "Monthly subscription — 22 KarmaCoins"
      );
    }
  }

  // ── Monthly renewal → credit 22 KC ──────────────────────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    // billing_reason = "subscription_cycle" means renewal (not the first payment)
    if (invoice.billing_reason === "subscription_cycle") {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata?.userId;

      if (userId) {
        await creditKarma(
          supabaseAdmin, userId, 22,
          "subscription_renewal", invoice.id,
          "Monthly subscription renewal — 22 KarmaCoins"
        );
      }
    }
  }

  // ── Subscription cancelled ───────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
