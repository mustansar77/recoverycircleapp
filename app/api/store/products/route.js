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
    .from("products")
    .select("id, title, description, price_coins, image_url, stock, is_active, created_at, categories(id, name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const auth = await isAdminCaller();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { title, description, price_coins, category_id, image_url, stock } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!price_coins || price_coins < 1) return NextResponse.json({ error: "Price must be at least 1 coin" }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin.from("products")
    .insert({ title: title.trim(), description, price_coins: Number(price_coins), category_id: category_id || null, image_url, stock: Number(stock) || 0 })
    .select("*, categories(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
