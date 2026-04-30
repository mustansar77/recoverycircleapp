import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

async function requireAdminCaller() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", user.id).single();

  if (!["admin", "superadmin"].includes(profile?.role)) {
    return { error: "Forbidden", status: 403 };
  }
  return { user, profile };
}

export async function GET() {
  const ctx = await requireAdminCaller();
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("karma_rewards")
    .select(`
      *,
      giver:profiles!karma_rewards_giver_id_fkey(full_name, email),
      receiver:profiles!karma_rewards_receiver_id_fkey(full_name, email),
      meeting:meetings(title)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const ctx = await requireAdminCaller();
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { receiver_id, amount, meeting_id, reason } = await request.json();

  if (!receiver_id || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "receiver_id and a positive amount are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Verify receiver exists and is a guide or user
  const { data: receiver } = await admin
    .from("profiles")
    .select("id, karma_coins, full_name, role")
    .eq("id", receiver_id)
    .single();

  if (!receiver) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  const coins = Number(amount);

  // Award coins
  await admin
    .from("profiles")
    .update({ karma_coins: (receiver.karma_coins ?? 0) + coins })
    .eq("id", receiver_id);

  // Log reward
  await admin.from("karma_rewards").insert({
    giver_id:    ctx.user.id,
    receiver_id,
    meeting_id:  meeting_id ?? null,
    amount:      coins,
    reason:      reason ?? "KarmaCoin reward",
  });

  // Log wallet transaction
  await admin.from("wallet_transactions").insert({
    user_id:      receiver_id,
    amount:       coins,
    type:         "credit",
    source:       "admin_reward",
    reference_id: ctx.user.id,
    description:  reason ?? `KarmaCoin reward from ${ctx.profile.role}`,
  });

  return NextResponse.json({ success: true, awarded: coins, recipient: receiver.full_name });
}
