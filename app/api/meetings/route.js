import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const { searchParams } = new URL(request.url);
  const type   = searchParams.get("type");    // guide | certification
  const hostMe = searchParams.get("host_me"); // "1" → only meetings where caller is host

  const admin = getAdminClient();
  let query = admin
    .from("meetings")
    .select(`
      *,
      host:profiles!meetings_host_id_fkey(id, full_name, email),
      registrations_count:meeting_registrations(count)
    `)
    .order("date", { ascending: true });

  if (type)   query = query.eq("type", type);
  if (hostMe) query = query.eq("host_id", user.id);

  // Users only see guide meetings (not certification) and non-cancelled
  if (profile?.role === "user") {
    query = query.eq("type", "guide").neq("status", "cancelled");
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark registration status for users
  if (profile?.role === "user" || profile?.role === "guide") {
    const { data: myRegs } = await admin
      .from("meeting_registrations")
      .select("meeting_id")
      .eq("user_id", user.id);

    const regSet = new Set((myRegs ?? []).map(r => r.meeting_id));
    return NextResponse.json(
      (data ?? []).map(m => ({
        ...m,
        is_registered: regSet.has(m.id),
        registration_count: m.registrations_count?.[0]?.count ?? 0,
      }))
    );
  }

  return NextResponse.json(
    (data ?? []).map(m => ({
      ...m,
      registration_count: m.registrations_count?.[0]?.count ?? 0,
    }))
  );
}

export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const role = profile?.role;
  const isAdmin = ["admin", "superadmin"].includes(role);
  const isGuide = role === "guide";

  if (!isAdmin && !isGuide) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, host_id, type, date, duration_minutes, max_participants, karma_cost } =
    await request.json();

  if (!title || !date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }

  // Guides can only create "guide" type meetings and are always the host
  if (isGuide) {
    if (type && type !== "guide") {
      return NextResponse.json({ error: "Guides can only create guide meetings" }, { status: 403 });
    }
  }

  // Admins can only create "certification" type meetings
  if (isAdmin && !["superadmin"].includes(role)) {
    if (type && type !== "certification") {
      return NextResponse.json({ error: "Admins can only create certification meetings" }, { status: 403 });
    }
  }

  const resolvedHostId = isGuide ? user.id : (host_id ?? user.id);
  const resolvedType   = isGuide ? "guide" : (type ?? "certification");

  if (!resolvedHostId) {
    return NextResponse.json({ error: "host_id is required" }, { status: 400 });
  }

  // Create Zoom meeting via API
  let zoom_meeting_id       = null;
  let zoom_meeting_password = "";
  try {
    const { createZoomMeeting } = await import("@/lib/zoom/api");
    const zm = await createZoomMeeting({
      topic:    title,
      duration: duration_minutes ?? 60,
      startTime: date,
    });
    zoom_meeting_id       = zm.id;
    zoom_meeting_password = zm.password;
  } catch (zoomErr) {
    console.error("Zoom meeting creation failed:", zoomErr.message);
    // Non-fatal — meeting saved without Zoom link; join will fail gracefully
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("meetings")
    .insert({
      title,
      description:          description ?? null,
      host_id:              resolvedHostId,
      type:                 resolvedType,
      date,
      duration_minutes:     duration_minutes ?? 60,
      zoom_meeting_id,
      zoom_meeting_password,
      max_participants:     max_participants ?? 50,
      karma_cost:           karma_cost ?? 2,
      created_by:           user.id,
      status:               "upcoming",
    })
    .select(`*, host:profiles!meetings_host_id_fkey(id, full_name, email)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
