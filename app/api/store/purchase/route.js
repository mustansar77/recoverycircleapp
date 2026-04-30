import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items, delivery } = await request.json();
  // items: [{ product_id, quantity }], delivery: { full_name, address, postal_code }
  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });
  if (!delivery?.full_name || !delivery?.address || !delivery?.postal_code) {
    return NextResponse.json({ error: "Full name, address and postal code are required" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Fetch products to validate price and stock
  const productIds = items.map((i) => i.product_id);
  const { data: products } = await admin
    .from("products")
    .select("id, title, price_coins, stock, is_active")
    .in("id", productIds);

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let totalCoins = 0;
  for (const item of items) {
    const product = productMap[item.product_id];
    if (!product?.is_active) return NextResponse.json({ error: `Product not available` }, { status: 400 });
    if (product.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.title}` }, { status: 400 });
    totalCoins += product.price_coins * item.quantity;
  }

  // Check user balance
  const { data: profile } = await admin.from("profiles").select("karma_coins").eq("id", user.id).single();
  if ((profile?.karma_coins ?? 0) < totalCoins) {
    return NextResponse.json({ error: "Insufficient KarmaCoins" }, { status: 400 });
  }

  // Create order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id:      user.id,
      status:       "pending",
      total_coins:  totalCoins,
      full_name:    delivery.full_name,
      address:      delivery.address,
      postal_code:  delivery.postal_code,
    })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  // Insert order items and decrement stock
  await admin.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_coins: productMap[item.product_id].price_coins,
    }))
  );

  for (const item of items) {
    await admin.from("products").update({ stock: productMap[item.product_id].stock - item.quantity }).eq("id", item.product_id);
  }

  // Deduct coins
  await admin.from("profiles").update({ karma_coins: profile.karma_coins - totalCoins }).eq("id", user.id);
  await admin.from("wallet_transactions").insert({
    user_id: user.id,
    amount: totalCoins,
    type: "debit",
    source: "store_purchase",
    reference_id: order.id,
    description: `Store purchase — ${items.length} item(s)`,
  });

  return NextResponse.json({ success: true, order_id: order.id });
}
