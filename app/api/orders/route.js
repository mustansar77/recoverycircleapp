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
    .from("orders")
    .select(`
      id, status, total_coins, created_at,
      profiles(id, full_name, email),
      order_items(id, quantity, price_coins, products(id, title, image_url))
    `)
    .order("created_at", { ascending: false });

  if (!["superadmin", "admin"].includes(profile?.role)) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
