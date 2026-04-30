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
  const { title, description, price_coins, category_id, image_url, stock, is_active } = await request.json();
  const admin = getAdminClient();

  const updates = {};
  if (title       !== undefined) updates.title       = title;
  if (description !== undefined) updates.description = description;
  if (price_coins !== undefined) updates.price_coins = Number(price_coins);
  if (category_id !== undefined) updates.category_id = category_id || null;
  if (image_url   !== undefined) updates.image_url   = image_url;
  if (stock       !== undefined) updates.stock       = Number(stock);
  if (is_active   !== undefined) updates.is_active   = is_active;

  const { data, error } = await admin.from("products").update(updates).eq("id", id).select("*, categories(id, name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await isAdminCaller();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;
  const admin = getAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
