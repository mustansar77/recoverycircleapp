import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_HOME = {
  superadmin: "/superadmin",
  admin: "/admin",
  guide: "/guide",
  user: "/user",
};

const ROLE_ALLOWED_PREFIXES = {
  superadmin: ["/superadmin", "/api"],
  admin:      ["/admin",      "/api"],
  guide:      ["/guide",      "/api"],
  user:       ["/user",       "/api"],
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth/")
  ) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Not authenticated → redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  // Root → role home
  if (pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/user", request.url));
  }

  // RBAC: deny access to other roles' routes
  const allowed = ROLE_ALLOWED_PREFIXES[role] ?? ["/user"];
  const isAllowed = allowed.some((prefix) => pathname.startsWith(prefix));
  if (!isAllowed) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/user", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
