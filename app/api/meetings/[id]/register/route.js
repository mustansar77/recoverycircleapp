import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(_, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();

  const { data: meeting, error: mErr } = await admin
    .from("meetings")
    .select("*, registrations_count:meeting_registrations(count)")
    .eq("id", id)
    .single();

  if (mErr || !meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  if (meeting.status !== "upcoming") {
    return NextResponse.json({ error: "Meeting is not open for registration" }, { status: 400 });
  }

  const registered = meeting.registrations_count?.[0]?.count ?? 0;
  if (registered >= meeting.max_participants) {
    return NextResponse.json({ error: "Meeting is full" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("meeting_registrations")
    .select("id")
    .eq("meeting_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Already registered for this meeting" }, { status: 400 });

  const { data: profile } = await admin
    .from("profiles")
    .select("karma_coins")
    .eq("id", user.id)
    .single();

  const cost    = meeting.karma_cost ?? 2;
  const balance = profile?.karma_coins ?? 0;

  if (balance < cost) {
    return NextResponse.json({
      error: `Insufficient KarmaCoins. You need ${cost} KC but only have ${balance} KC.`,
    }, { status: 400 });
  }

  await admin.from("profiles").update({ karma_coins: balance - cost }).eq("id", user.id);

  const { error: regErr } = await admin
    .from("meeting_registrations")
    .insert({ meeting_id: id, user_id: user.id, karma_spent: cost });

  if (regErr) {
    await admin.from("profiles").update({ karma_coins: balance }).eq("id", user.id);
    return NextResponse.json({ error: regErr.message }, { status: 500 });
  }

  await admin.from("wallet_transactions").insert({
    user_id:      user.id,
    amount:       -cost,
    type:         "debit",
    source:       "meeting_registration",
    reference_id: id,
    description:  `Registered for "${meeting.title}"`,
  });

  return NextResponse.json({ success: true, karma_spent: cost, new_balance: balance - cost });
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();

  const { data: reg } = await admin
    .from("meeting_registrations")
    .select("karma_spent")
    .eq("meeting_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!reg) return NextResponse.json({ error: "Not registered" }, { status: 404 });

  const { data: meeting } = await admin
    .from("meetings").select("status").eq("id", id).single();

  if (meeting?.status !== "upcoming") {
    return NextResponse.json({ error: "Cannot unregister from a meeting that has started" }, { status: 400 });
  }

  await admin.from("meeting_registrations")
    .delete()
    .eq("meeting_id", id)
    .eq("user_id", user.id);

  const { data: profile } = await admin.from("profiles").select("karma_coins").eq("id", user.id).single();
  await admin.from("profiles")
    .update({ karma_coins: (profile?.karma_coins ?? 0) + reg.karma_spent })
    .eq("id", user.id);

  return NextResponse.json({ success: true, refunded: reg.karma_spent });
}
