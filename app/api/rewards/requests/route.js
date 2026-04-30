import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const admin = getAdminClient();

  let query = admin
    .from("reward_requests")
    .select(`
      id, amount, description, status, created_at, processed_at,
      meetings(id, title, date),
      guide:profiles!reward_requests_guide_id_fkey(id, full_name, email),
      requester:profiles!reward_requests_requested_by_fkey(id, full_name),
      processor:profiles!reward_requests_processed_by_fkey(id, full_name)
    `)
    .order("created_at", { ascending: false });

  if (!["superadmin", "admin"].includes(profile?.role)) {
    query = query.eq("guide_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["superadmin", "admin"].includes(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { meeting_id, guide_id, amount, description } = await request.json();
  const admin = getAdminClient();

  const { data, error } = await admin.from("reward_requests").insert({
    meeting_id,
    guide_id,
    requested_by: user.id,
    amount: Number(amount),
    description,
    status: "pending",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
