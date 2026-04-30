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

export async function GET(request) {
  const ctx = await getCallerProfile();
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  if (!["superadmin", "admin"].includes(ctx.profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const admin = getAdminClient();

  let query = admin
    .from("profiles")
    .select("id, full_name, email, role, karma_coins, created_at, subscriptions(status, tier)")
    .order("created_at", { ascending: false });

  if (role) query = query.eq("role", role);
  else query = query.neq("role", "superadmin");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const ctx = await getCallerProfile();
  if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { full_name, email, password, role } = await request.json();

  if (role === "admin" && ctx.profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Only superadmin can create admin accounts" }, { status: 403 });
  }
  if (!["superadmin", "admin"].includes(ctx.profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getAdminClient();
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  await admin.from("profiles").update({ role, full_name }).eq("id", newUser.user.id);

  return NextResponse.json({ success: true, id: newUser.user.id });
}
