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

export async function PUT(request, { params }) {
  const auth = await isAdminCaller();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const { name, description } = await request.json();
  const admin = getAdminClient();
  const { data, error } = await admin.from("categories").update({ name, description }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await isAdminCaller();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = getAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
