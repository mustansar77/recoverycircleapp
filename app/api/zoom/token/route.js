// Deprecated — Zoom SDK signature no longer used.
// Meeting joins now use Zoom Web Client via direct URL.
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "Not used" }, { status: 410 });
}
