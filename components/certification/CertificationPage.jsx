"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Award, CheckCircle, Coins, Star, CreditCard, ChevronRight, Users, BookOpen, Trophy, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const LEVELS = [
  {
    level: 1,
    name: "Fresh Start Guide",
    color: "blue",
    description: "Basics of running a supportive meeting.",
    requirements: "Complete Basics of Recovery Leadership.",
    benefits: "Eligible to lead meetings and earn KarmaCoins.",
  },
  {
    level: 2,
    name: "Pathway Pioneer",
    color: "teal",
    description: "Advanced communication and group management.",
    requirements: "Complete Advanced Facilitation Techniques.",
    benefits: "Higher KarmaCoin earnings; mentor eligibility.",
  },
  {
    level: 3,
    name: "Community Connector",
    color: "purple",
    description: "Focus on expanding networks and empowering others.",
    requirements: "Lead 10 meetings with 5+ paid participants.",
    benefits: "Featured leader; earn bonus KarmaCoins.",
  },
  {
    level: 4,
    name: "Hope Ambassador",
    color: "amber",
    description: "Recognizes leaders supporting larger groups and resources.",
    requirements: "Lead 20 meetings; contribute educational content.",
    benefits: "Personalized certificate; lead special events.",
  },
  {
    level: 5,
    name: "Recovery Visionary",
    color: "green",
    description: "The highest level for exceptional commitment to recovery.",
    requirements: "Lead 50+ meetings; mentor 5+ leaders.",
    benefits: "Lifetime certification; exclusive rewards.",
  },
];

const LEVEL_ICONS = { 1: BookOpen, 2: Star, 3: Users, 4: Award, 5: Trophy };

// Already a guide — show their certified status
function CertifiedView({ subscription }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Certification</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Your guide status</p>
      </div>
      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center gap-4 max-w-md"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--green-border)" }}
      >
        <div className="h-16 w-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--green-bg)" }}>
          <CheckCircle size={32} style={{ color: "var(--green)" }} />
        </div>
        <div>
          <p className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>You're a Certified Guide!</p>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            You can now host meetings and earn KarmaCoins.
          </p>
        </div>
        {subscription?.status === "active" && (
          <Badge color="green">${subscription.tier}/month · Active subscription</Badge>
        )}
      </div>
      <CertificationLevels />
    </div>
  );
}

function CertificationLevels() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Certification Levels</h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
              {["Level", "Description", "Requirements", "Benefits"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-3)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l, i) => {
              const Icon = LEVEL_ICONS[l.level];
              return (
                <tr key={l.level} style={{
                  backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--card)",
                  borderBottom: i < LEVELS.length - 1 ? "1px solid var(--border-sub)" : undefined,
                }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `var(--${l.color}-bg)`, border: `1px solid var(--${l.color}-border)` }}>
                        <Icon size={13} style={{ color: `var(--${l.color})` }} />
                      </div>
                      <span className="font-semibold text-xs whitespace-nowrap" style={{ color: "var(--text)" }}>{l.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-2)" }}>{l.description}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-2)" }}>{l.requirements}</td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-2)" }}>{l.benefits}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CertificationPage({ existingSubscription, userRole, karmaBalance }) {
  const [kcLoading,  setKcLoading]  = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [kcError,    setKcError]    = useState("");
  const [subError,   setSubError]   = useState("");
  const [subBanner,  setSubBanner]  = useState(null); // { status, msg, coins }
  const searchParams = useSearchParams();
  const router       = useRouter();
  const verified     = useRef(false);

  useEffect(() => {
    const isSubscribed = searchParams.get("subscribed") === "1";
    const sessionId    = searchParams.get("session_id");
    if (!isSubscribed || !sessionId || verified.current) return;
    verified.current = true;

    setSubBanner({ status: "loading", msg: "Confirming your subscription…", coins: 0 });

    fetch("/api/stripe/verify-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setSubBanner({ status: "error", msg: data.error, coins: 0 }); return; }
        const coins = data.coins ?? 22;
        setSubBanner({ status: "success", msg: `${coins} KarmaCoins added to your account!`, coins });
        setTimeout(() => {
          setSubBanner(null);
          router.replace("/user/certification", { scroll: false });
        }, 4000);
      })
      .catch(() => setSubBanner({ status: "error", msg: "Could not verify subscription. Please refresh.", coins: 0 }));
  }, [searchParams, router]);

  const isGuide = userRole === "guide";

  if (isGuide) return <CertifiedView subscription={existingSubscription} />;

  // ── Start Certification via 10 KarmaCoins ──────────────────────────────
  async function handleKarmaCert() {
    setKcLoading(true); setKcError("");
    const res  = await fetch("/api/certification", { method: "POST" });
    const data = await res.json();
    setKcLoading(false);
    if (!res.ok) { setKcError(data.error); return; }
    window.location.reload();
  }

  // ── Subscribe via Stripe ($20/month) ──────────────────────────────────
  async function handleSubscribe() {
    setSubLoading(true); setSubError("");
    const res  = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscription" }),
    });
    const data = await res.json();
    setSubLoading(false);
    if (!res.ok) { setSubError(data.error); return; }
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="space-y-8">

      {/* Subscription banner */}
      {subBanner && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{
            backgroundColor: subBanner.status === "success" ? "var(--green-bg)" : subBanner.status === "error" ? "var(--red-bg)" : "var(--blue-bg)",
            border: `1px solid ${subBanner.status === "success" ? "var(--green-border)" : subBanner.status === "error" ? "var(--red-border)" : "var(--blue-border)"}`,
          }}>
          {subBanner.status === "loading" && <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: "var(--blue-light)" }} />}
          {subBanner.status === "success" && <CheckCircle size={18} className="flex-shrink-0" style={{ color: "var(--green)" }} />}
          {subBanner.status === "error"   && <Coins size={18} className="flex-shrink-0" style={{ color: "var(--red)" }} />}
          <div>
            <p className="text-sm font-semibold" style={{ color: subBanner.status === "success" ? "var(--green)" : subBanner.status === "error" ? "var(--red)" : "var(--blue-light)" }}>
              {subBanner.status === "success" ? "Subscription activated!" : subBanner.status === "error" ? "Something went wrong" : "Processing…"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{subBanner.msg}</p>
          </div>
          {subBanner.status === "success" && (
            <div className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold text-sm"
              style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", color: "var(--yellow)" }}>
              <Coins size={14} /> +{subBanner.coins} KC
            </div>
          )}
        </div>
      )}

      {/* Hero */}
      <div className="rounded-2xl p-8 text-center space-y-3"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
            <Award size={30} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Become a Certified Recovery Circle Leader
        </h1>
        <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "var(--text-2)" }}>
          Benefits of becoming a certified leader include credibility, opportunities to host meetings, and earn KarmaCoins.
        </p>
      </div>

      {/* Two paths */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl mx-auto">

        {/* Path 1 — KarmaCoins */}
        <div className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--yellow-border)" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--yellow-bg)" }}>
              <Coins size={20} style={{ color: "var(--yellow)" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Start Certification</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Pay with KarmaCoins</p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: "var(--yellow)" }}>10</span>
              <span className="text-sm font-semibold" style={{ color: "var(--yellow)" }}>KarmaCoins</span>
              <span className="text-xs ml-1" style={{ color: "var(--text-3)" }}>one-time</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>
              Instantly become a guide. Host meetings and earn KarmaCoins.
            </p>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
              <Coins size={11} style={{ color: "var(--yellow)" }} />
              Your balance: <span className="font-semibold" style={{ color: karmaBalance >= 10 ? "var(--green)" : "var(--red)" }}>
                {karmaBalance} KC
              </span>
            </div>
          </div>

          {kcError && (
            <p className="text-xs rounded-xl px-3 py-2"
              style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
              {kcError}
            </p>
          )}

          <Button
            onClick={handleKarmaCert}
            disabled={kcLoading || karmaBalance < 10}
            className="w-full"
            variant={karmaBalance >= 10 ? "primary" : "secondary"}
          >
            <Coins size={13} />
            {kcLoading ? "Processing…" : karmaBalance >= 10 ? "Start Certification — 10 KC" : "Not enough KarmaCoins"}
          </Button>
        </div>

        {/* Path 2 — Stripe Subscription */}
        <div className="rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
          style={{ backgroundColor: "var(--surface)", border: "2px solid var(--purple)" }}>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-1.5"
            style={{ backgroundColor: "var(--purple-bg)" }}>
            <Star size={11} fill="var(--purple)" style={{ color: "var(--purple)" }} />
            <span className="text-xs font-semibold ml-1" style={{ color: "var(--purple)" }}>Recommended</span>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--purple-bg)" }}>
              <CreditCard size={20} style={{ color: "var(--purple)" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Subscribe</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Monthly via Stripe</p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: "var(--text)" }}>$20</span>
              <span className="text-sm" style={{ color: "var(--text-3)" }}>/month</span>
            </div>
            <ul className="space-y-1.5">
              {[
                "Receive 22 KarmaCoins every month",
                "Use KC to pay for certification",
                "Auto-renews · cancel anytime",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-2)" }}>
                  <CheckCircle size={12} style={{ color: "var(--green)" }} className="flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs pt-1 rounded-lg px-2 py-1.5"
              style={{ backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }}>
              💡 Subscribe to earn KC, then use "Start Certification" to become a guide.
            </p>
          </div>

          {subError && (
            <p className="text-xs rounded-xl px-3 py-2"
              style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
              {subError}
            </p>
          )}

          <Button onClick={handleSubscribe} disabled={subLoading} className="w-full">
            <ChevronRight size={13} />
            {subLoading ? "Redirecting…" : "Get 22 KC/month — $20"}
          </Button>
        </div>
      </div>

      {/* Levels table */}
      <CertificationLevels />
    </div>
  );
}
