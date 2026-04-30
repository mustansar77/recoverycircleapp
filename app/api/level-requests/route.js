import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

const LEVEL_NAMES = [
  "", // 0 — not certified
  "Fresh Start Guide",
  "Pathway Pioneer",
  "Community Connector",
  "Hope Ambassador",
  "Recovery Visionary",
];

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "superadmin"].includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("level_requests")
    .select(`
      id, status, created_at, processed_at,
      guide:profiles!level_requests_guide_id_fkey(id, full_name, email, certification_level),
      meeting:meetings!level_requests_meeting_id_fkey(id, title, date),
      requester:profiles!level_requests_requested_by_fkey(id, full_name),
      processor:profiles!level_requests_processed_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "superadmin"].includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { meeting_id } = await request.json();
  if (!meeting_id) return NextResponse.json({ error: "meeting_id is required" }, { status: 400 });

  const admin = getAdminClient();

  // Validate meeting — must be certification type and ended
  const { data: meeting } = await admin
    .from("meetings")
    .select("id, type, status, host_id")
    .eq("id", meeting_id)
    .single();

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  if (meeting.type !== "certification") return NextResponse.json({ error: "Only certification meetings can generate level requests" }, { status: 400 });
  if (meeting.status !== "ended") return NextResponse.json({ error: "Meeting must be ended to generate a request" }, { status: 400 });

  // Check guide's current level — max is 5
  const { data: guideProfile } = await admin
    .from("profiles")
    .select("certification_level, full_name")
    .eq("id", meeting.host_id)
    .single();

  const currentLevel = guideProfile?.certification_level ?? 0;
  if (currentLevel >= 5) {
    return NextResponse.json({ error: `${guideProfile?.full_name ?? "Guide"} is already at the highest level (Recovery Visionary)` }, { status: 400 });
  }

  // Insert — UNIQUE(meeting_id) will reject duplicates
  const { data, error } = await admin
    .from("level_requests")
    .insert({
      guide_id: meeting.host_id,
      meeting_id,
      requested_by: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A level-up request already exists for this meeting" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, next_level: LEVEL_NAMES[currentLevel + 1] }, { status: 201 });
}
