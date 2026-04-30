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

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Must be paid and belong to this user
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: "Session does not belong to this user" }, { status: 403 });
    }
    if (session.metadata?.type !== "karma") {
      return NextResponse.json({ error: "Not a karma purchase" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Idempotency check — only credit once per session_id
    const { data: existing } = await admin
      .from("wallet_transactions")
      .select("id")
      .eq("reference_id", session_id)
      .eq("source", "stripe")
      .maybeSingle();

    if (existing) {
      // Already credited (by webhook or previous call)
      return NextResponse.json({ already_credited: true, coins: Number(session.metadata.coins) });
    }

    // Credit the coins
    const coins = Number(session.metadata.coins);
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
      user_id: user.id,
      amount: coins,
      type: "credit",
      source: "stripe",
      reference_id: session_id,
      description: `Purchased ${coins} KarmaCoins via Stripe`,
    });

    return NextResponse.json({ credited: true, coins });
  } catch (err) {
    console.error("verify-session error:", err);
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
