import Stripe from "stripe";

// Lazy singleton — only instantiated at request time, not build time
let _stripe;
export function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" });
  return _stripe;
}
export const stripe = new Proxy({}, { get: (_, prop) => getStripe()[prop] });

export const KARMA_RATE = { usd: 1, coins: 1 }; // $1 = 1 KarmaCoin

// $20/month subscription → guide role + 22 KC per month
export const SUBSCRIPTION_PLANS = [
  { id: "plan_20", name: "Monthly Guide", price: 20, coins: 22, priceId: process.env.STRIPE_PRICE_ID_20 },
];
