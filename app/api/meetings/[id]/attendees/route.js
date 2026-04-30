import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(_, { params }) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (!["admin", "superadmin"].includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();

  // Step 1 — fetch registrations (avoid joining columns that may not exist yet)
  const { data: regs, error: regErr } = await admin
    .from("meeting_registrations")
    .select("id, user_id, created_at")
    .eq("meeting_id", id)
    .order("created_at", { ascending: true });

  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 });
  if (!regs?.length) return NextResponse.json([]);

  // Step 2 — fetch profiles for those users
  const userIds = regs.map(r => r.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  const result = regs.map(r => ({
    id:          r.id,
    created_at:  r.created_at,
    karma_spent: r.karma_spent ?? 0,
    user:        profileMap[r.user_id] ?? { id: r.user_id, full_name: null, email: null },
  }));

  return NextResponse.json(result);
}
