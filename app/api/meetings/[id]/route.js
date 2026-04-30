import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(_, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from("meetings")
    .select(`
      *,
      host:profiles!meetings_host_id_fkey(id, full_name, email),
      registrations_count:meeting_registrations(count)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...data, registration_count: data.registrations_count?.[0]?.count ?? 0 });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const role    = profile?.role;
  const isAdmin = ["admin", "superadmin"].includes(role);
  const isGuide = role === "guide";

  if (!isAdmin && !isGuide) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();

  // Guides can only update their own meetings
  if (isGuide) {
    const { data: meeting } = await admin
      .from("meetings")
      .select("host_id, type")
      .eq("id", id)
      .single();

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    if (meeting.host_id !== user.id) {
      return NextResponse.json({ error: "You can only update your own meetings" }, { status: 403 });
    }
  }

  const body = await request.json();

  // Only allow safe fields to be updated — never let client overwrite zoom credentials
  const {
    title, description, date, duration_minutes, max_participants,
    karma_cost, status, host_id, type,
    zoom_meeting_id, zoom_meeting_password,
  } = body;

  // Build update object with only defined fields
  const updates = {};
  if (title                !== undefined) updates.title                = title;
  if (description          !== undefined) updates.description          = description;
  if (date                 !== undefined) updates.date                 = date;
  if (duration_minutes     !== undefined) updates.duration_minutes     = Number(duration_minutes);
  if (max_participants     !== undefined) updates.max_participants     = Number(max_participants);
  if (karma_cost           !== undefined) updates.karma_cost           = Number(karma_cost);
  if (status               !== undefined) updates.status               = status;
  if (zoom_meeting_id      !== undefined) updates.zoom_meeting_id      = zoom_meeting_id;
  if (zoom_meeting_password !== undefined) updates.zoom_meeting_password = zoom_meeting_password;
  // Only admin can change host and type
  if (isAdmin && host_id !== undefined) updates.host_id = host_id;
  if (isAdmin && type    !== undefined) updates.type    = type;

  const { data, error } = await admin
    .from("meetings")
    .update(updates)
    .eq("id", id)
    .select(`*, host:profiles!meetings_host_id_fkey(id, full_name, email)`)
    .single();

  if (error) {
    console.error("Meeting PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const role    = profile?.role;
  const isAdmin = ["admin", "superadmin"].includes(role);
  const isGuide = role === "guide";

  if (!isAdmin && !isGuide) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();

  // Guides can only delete their own meetings
  if (isGuide) {
    const { data: meeting } = await admin
      .from("meetings").select("host_id").eq("id", id).single();
    if (!meeting || meeting.host_id !== user.id) {
      return NextResponse.json({ error: "You can only delete your own meetings" }, { status: 403 });
    }
  }

  await admin.from("meetings").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
