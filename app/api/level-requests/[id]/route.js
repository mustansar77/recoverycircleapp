import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

const MAX_LEVEL = 5;

const LEVEL_NAMES = [
  "", "Fresh Start Guide", "Pathway Pioneer",
  "Community Connector", "Hope Ambassador", "Recovery Visionary",
];

export async function PUT(request, { params }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only superadmin can approve/reject
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Only superadmin can process level requests" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await request.json(); // "approve" | "reject"
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: req } = await admin
    .from("level_requests")
    .select("guide_id, status")
    .eq("id", id)
    .single();

  if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (req.status !== "pending") return NextResponse.json({ error: "Request already processed" }, { status: 400 });

  // Update request status
  await admin.from("level_requests").update({
    status: action === "approve" ? "approved" : "rejected",
    processed_by: user.id,
    processed_at: new Date().toISOString(),
  }).eq("id", id);

  if (action === "approve") {
    const { data: guideProfile } = await admin
      .from("profiles")
      .select("certification_level, full_name")
      .eq("id", req.guide_id)
      .single();

    const currentLevel = guideProfile?.certification_level ?? 0;
    const newLevel = Math.min(currentLevel + 1, MAX_LEVEL);

    await admin.from("profiles")
      .update({ certification_level: newLevel })
      .eq("id", req.guide_id);

    return NextResponse.json({
      success: true,
      new_level: newLevel,
      level_name: LEVEL_NAMES[newLevel],
      guide_name: guideProfile?.full_name,
    });
  }

  return NextResponse.json({ success: true });
}
