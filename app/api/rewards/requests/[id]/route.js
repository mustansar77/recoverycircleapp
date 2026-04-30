import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function PUT(request, { params }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["superadmin", "admin"].includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json(); // "approve" | "reject"
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: req, error: fetchError } = await admin
    .from("reward_requests")
    .select("guide_id, amount, status")
    .eq("id", id)
    .single();

  if (fetchError || !req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (req.status !== "pending") return NextResponse.json({ error: "Request already processed" }, { status: 400 });

  const newStatus = action === "approve" ? "approved" : "rejected";

  await admin.from("reward_requests").update({
    status: newStatus,
    processed_by: user.id,
    processed_at: new Date().toISOString(),
  }).eq("id", id);

  if (action === "approve") {
    const { data: guideProfile } = await admin.from("profiles").select("karma_coins").eq("id", req.guide_id).single();
    await admin.from("profiles")
      .update({ karma_coins: (guideProfile?.karma_coins ?? 0) + req.amount })
      .eq("id", req.guide_id);

    await admin.from("wallet_transactions").insert({
      user_id: req.guide_id,
      amount: req.amount,
      type: "credit",
      source: "reward",
      reference_id: id,
      description: `KarmaCoin reward approved`,
    });
  }

  return NextResponse.json({ success: true });
}
