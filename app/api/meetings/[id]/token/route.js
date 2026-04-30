import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(_, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdminClient();

  const [{ data: meeting }, { data: profile }] = await Promise.all([
    admin.from("meetings")
      .select("id, title, host_id, zoom_meeting_id, zoom_meeting_password, status")
      .eq("id", id)
      .single(),
    admin.from("profiles").select("role, full_name").eq("id", user.id).single(),
  ]);

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  if (meeting.status === "cancelled") return NextResponse.json({ error: "Meeting has been cancelled" }, { status: 400 });

  if (!meeting.zoom_meeting_id) {
    return NextResponse.json(
      { error: "Zoom meeting not set up. Ask your admin to edit the meeting and add the Zoom Meeting ID." },
      { status: 400 }
    );
  }

  const isHost  = meeting.host_id === user.id;
  const isAdmin = ["admin", "superadmin"].includes(profile?.role);
  const role    = (isHost || isAdmin) ? 1 : 0;

  // Non-host, non-admin must be registered
  if (role === 0) {
    const { data: reg } = await admin
      .from("meeting_registrations")
      .select("id")
      .eq("meeting_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!reg) return NextResponse.json({ error: "You are not registered for this meeting" }, { status: 403 });
  }

  const displayName = profile?.full_name ?? user.id.slice(0, 8);

  return NextResponse.json({
    meetingNumber: String(meeting.zoom_meeting_id),
    password:      meeting.zoom_meeting_password ?? "",
    displayName,
    role,
    meetingTitle:  meeting.title,
  });
}
