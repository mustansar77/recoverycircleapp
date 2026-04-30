"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Video, Coins, CalendarCheck, CheckCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/ui/Card";

export default function GuideDashboardClient({ balance: initialBalance, totalHosted, upcomingCount }) {
  const [balance,     setBalance]  = useState(initialBalance);
  const [karmaBanner, setBanner]   = useState(null);
  const searchParams = useSearchParams();
  const router       = useRouter();
  const verified     = useRef(false);

  useEffect(() => {
    const isKarma   = searchParams.get("karma") === "success";
    const sessionId = searchParams.get("session_id");
    if (!isKarma || !sessionId || verified.current) return;
    verified.current = true;

    const coins = Number(searchParams.get("coins") ?? 0);
    setBanner({ coins, status: "loading", msg: "Confirming your purchase…" });

    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setBanner({ coins, status: "error", msg: data.error }); return; }
        const credited = data.coins ?? coins;
        setBalance(prev => data.already_credited ? prev : prev + credited);
        setBanner({ coins: credited, status: "success", msg: `${credited} KarmaCoins added to your account!` });
        setTimeout(() => { setBanner(null); router.replace("/guide", { scroll: false }); }, 4000);
      })
      .catch(() => setBanner({ coins, status: "error", msg: "Could not verify purchase. Please refresh." }));
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      {/* KarmaCoin purchase banner */}
      {karmaBanner && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{
            backgroundColor: karmaBanner.status === "success" ? "var(--green-bg)" : karmaBanner.status === "error" ? "var(--red-bg)" : "var(--blue-bg)",
            border: `1px solid ${karmaBanner.status === "success" ? "var(--green-border)" : karmaBanner.status === "error" ? "var(--red-border)" : "var(--blue-border)"}`,
          }}>
          {karmaBanner.status === "loading"  && <Loader2    size={18} className="animate-spin flex-shrink-0" style={{ color: "var(--blue-light)" }} />}
          {karmaBanner.status === "success"  && <CheckCircle size={18} className="flex-shrink-0"             style={{ color: "var(--green)" }} />}
          {karmaBanner.status === "error"    && <Coins       size={18} className="flex-shrink-0"             style={{ color: "var(--red)" }} />}
          <div>
            <p className="text-sm font-semibold" style={{
              color: karmaBanner.status === "success" ? "var(--green)" : karmaBanner.status === "error" ? "var(--red)" : "var(--blue-light)",
            }}>
              {karmaBanner.status === "success" ? "Payment successful!" : karmaBanner.status === "error" ? "Something went wrong" : "Processing…"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>{karmaBanner.msg}</p>
          </div>
          {karmaBanner.status === "success" && (
            <div className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold text-sm"
              style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", color: "var(--yellow)" }}>
              <Coins size={14} /> {balance} KC
            </div>
          )}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Guide Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Your sessions and earnings</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="KarmaCoins Balance" value={balance}       icon={Coins}         color="amber" />
        <StatCard label="Sessions Hosted"    value={totalHosted}   icon={CalendarCheck} color="teal"  />
        <StatCard label="Upcoming Sessions"  value={upcomingCount} icon={Video}         color="blue"  />
      </div>
    </div>
  );
}
