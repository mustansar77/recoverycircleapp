"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Heart, Shield, Star, Zap } from "lucide-react";

const ROLE_REDIRECTS = { superadmin: "/superadmin", admin: "/admin", guide: "/guide", user: "/user" };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const STATS = [
  { icon: Shield, label: "Certified Guides",  value: "200+" },
  { icon: Star,   label: "Active Members",    value: "5K+" },
  { icon: Zap,    label: "Sessions Monthly",  value: "1K+" },
];

const fieldBase = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function onFocus(e)  { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }
  function onBlur(e)   { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    router.push(ROLE_REDIRECTS[profile?.role] ?? "/user");
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {/* Glow */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full opacity-8 pointer-events-none"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
            <Heart size={19} className="text-white" fill="white" />
          </div>
          <div>
            <span className="text-xl font-bold" style={{ color: "var(--text)" }}>RecoveryCircle</span>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Healing together</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4" style={{ color: "var(--text)" }}>
              Your journey to<br />
              <span style={{ color: "var(--blue-light)" }}>healing</span> starts here
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
              Join thousands on a guided path to recovery through community, education, and live sessions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <Icon size={17} className="mx-auto mb-2" style={{ color: "var(--blue-light)" }} />
                <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} fill="var(--yellow)" style={{ color: "var(--yellow)" }} />
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            &ldquo;RecoveryCircle gave me the tools and community I needed to reclaim my life.&rdquo;
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
            >
              S
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Sarah M.</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Member since 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
            <Heart size={17} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "var(--text)" }}>RecoveryCircle</span>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="mb-7">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Welcome back</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>Sign in to your account to continue</p>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-2)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
            >
              <GoogleIcon />
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: "1px solid var(--border)" }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--text-3)" }}>
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Email address</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={fieldBase}
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Password</label>
                  <button type="button" className="text-xs font-medium transition-colors hover:underline" style={{ color: "var(--blue-light)" }}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={fieldBase}
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", paddingRight: "44px" }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--text-3)" }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading || googleLoading}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:brightness-105 active:scale-[0.98] mt-1"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm" style={{ color: "var(--text-3)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold transition-colors hover:underline" style={{ color: "var(--blue-light)" }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
