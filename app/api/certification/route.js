import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

const CERTIFICATION_COST = 10; // KarmaCoins

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, karma_coins")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "user") {
    return NextResponse.json({ error: "Only members can start certification" }, { status: 400 });
  }

  const balance = profile?.karma_coins ?? 0;
  if (balance < CERTIFICATION_COST) {
    return NextResponse.json({
      error: `You need ${CERTIFICATION_COST} KarmaCoins to start certification. You have ${balance} KC.`,
    }, { status: 400 });
  }

  // Deduct KC
  await admin
    .from("profiles")
    .update({ karma_coins: balance - CERTIFICATION_COST, role: "guide" })
    .eq("id", user.id);

  // Log wallet transaction
  await admin.from("wallet_transactions").insert({
    user_id: user.id,
    amount: -CERTIFICATION_COST,
    type: "debit",
    source: "certification",
    description: "Paid for guide certification",
  });

  return NextResponse.json({ success: true, new_balance: balance - CERTIFICATION_COST });
}
