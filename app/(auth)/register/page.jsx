"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Heart, CheckCircle, Check } from "lucide-react";

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

const PERKS = [
  "Join live healing sessions",
  "Earn & spend KarmaCoins",
  "Access certified guides",
  "Track your progress",
];

const fieldBase = "w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all";

export default function RegisterPage() {
  const [form, setForm]         = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess]   = useState(false);

  function set(f) { return (e) => setForm(p => ({ ...p, [f]: e.target.value })); }
  function onFocus(e) { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }
  function onBlur(e)  { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }

  async function handleSubmit(e) {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8)       { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name } },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "var(--bg)" }}>
        <div className="w-full max-w-md rounded-2xl p-10 text-center" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--green-bg)", border: "1px solid var(--green-border)" }}>
            <CheckCircle size={30} style={{ color: "var(--green)" }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Check your email</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-2)" }}>
            A confirmation link was sent to <strong style={{ color: "var(--text)" }}>{form.email}</strong>.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-105"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--bg)" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
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
              Start your<br /><span style={{ color: "var(--blue-light)" }}>healing</span> journey today
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-2)" }}>
              Create your free account and join a community dedicated to growth and mutual support.
            </p>
          </div>
          <div className="space-y-3">
            {PERKS.map(p => (
              <div key={p} className="flex items-center gap-3">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--blue-bg)", border: "1px solid var(--blue-border)" }}
                >
                  <Check size={11} style={{ color: "var(--blue-light)" }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-2)" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            🌿 Free to join — upgrade anytime to become a certified Guide and earn KarmaCoins.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
            <Heart size={17} className="text-white" fill="white" />
          </div>
          <span className="text-xl font-bold" style={{ color: "var(--text)" }}>RecoveryCircle</span>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="mb-7">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Create your account</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>Free to join — no credit card required</p>
            </div>

            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-2)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
            >
              <GoogleIcon />
              {googleLoading ? "Redirecting…" : "Sign up with Google"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: "1px solid var(--border)" }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs" style={{ backgroundColor: "var(--surface)", color: "var(--text-3)" }}>
                  or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Full Name",     field: "full_name", type: "text",  placeholder: "Jane Doe" },
                { label: "Email address", field: "email",     type: "email", placeholder: "you@example.com" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{label}</label>
                  <input
                    type={type} required value={form[field]}
                    onChange={set(field)} placeholder={placeholder}
                    className={fieldBase}
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} required value={form.password}
                    onChange={set("password")} placeholder="Min 8 characters"
                    className={fieldBase}
                    style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", paddingRight: "44px" }}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--text-3)" }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Confirm Password</label>
                <input
                  type="password" required value={form.confirm}
                  onChange={set("confirm")} placeholder="Re-enter your password"
                  className={fieldBase}
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)" }}>
                  {error}
                </div>
              )}

              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                By creating an account you agree to our{" "}
                <span className="cursor-pointer hover:underline" style={{ color: "var(--blue-light)" }}>Terms of Service</span>{" "}
                and <span className="cursor-pointer hover:underline" style={{ color: "var(--blue-light)" }}>Privacy Policy</span>.
              </p>

              <button
                type="submit" disabled={loading || googleLoading}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:brightness-105 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm" style={{ color: "var(--text-3)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--blue-light)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
