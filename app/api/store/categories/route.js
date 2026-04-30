import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

async function isAdminCaller() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["superadmin", "admin"].includes(p?.role)) return { error: "Forbidden", status: 403 };
  return { ok: true };
}

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description, created_at")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const auth = await isAdminCaller();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { name, description } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin.from("categories").insert({ name: name.trim(), description }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
