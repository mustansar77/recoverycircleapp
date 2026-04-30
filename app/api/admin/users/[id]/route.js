import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

async function getCallerProfile() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
  return { user, profile };
}

export async function PUT(request, { params }) {
  const ctx = await getCallerProfile();
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!["superadmin", "admin"].includes(ctx.profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { full_name, email, role } = await request.json();
  const admin = getAdminClient();

  const updates = {};
  if (full_name) updates.full_name = full_name;
  if (role)      updates.role = role;

  if (email) {
    const { error: authError } = await admin.auth.admin.updateUserById(id, { email });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { error } = await admin.from("profiles").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
  const ctx = await getCallerProfile();
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (ctx.profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Only superadmin can delete accounts" }, { status: 403 });
  }

  const { id } = await params;
  const admin = getAdminClient();

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
