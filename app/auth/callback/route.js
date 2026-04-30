import { NextResponse } from "next/server";
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code       = requestUrl.searchParams.get("code");
  const origin     = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();

    const supabase = _createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const ROLE_HOME = {
        superadmin: "/superadmin",
        admin:      "/admin",
        guide:      "/guide",
        user:       "/user",
      };

      return NextResponse.redirect(new URL(ROLE_HOME[profile?.role] ?? "/user", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
}
