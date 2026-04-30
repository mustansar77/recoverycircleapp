"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Video, Coins, ShoppingBag, Award, CheckCircle, Loader2 } from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import BuyKarmaModal from "@/components/karma/BuyKarmaModal";
import Link from "next/link";

export default function UserDashboardClient({ balance: initialBalance, registeredMeetings, orderCount, subscription }) {
  const [buyModal, setBuyModal]   = useState(false);
  const [balance,  setBalance]    = useState(initialBalance);
  const [karmaBanner, setBanner]  = useState(null); // { coins, status: "loading"|"success"|"error", msg }
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
        if (data.error) {
          setBanner({ coins, status: "error", msg: data.error });
          return;
        }
        const credited = data.coins ?? coins;
        setBalance(prev => data.already_credited ? prev : prev + credited);
        setBanner({ coins: credited, status: "success", msg: `${credited} KarmaCoins added to your account!` });
        // Clean URL after 4 seconds
        setTimeout(() => {
          setBanner(null);
          router.replace("/user", { scroll: false });
        }, 4000);
      })
      .catch(() => setBanner({ coins, status: "error", msg: "Could not verify purchase. Please refresh." }));
  }, [searchParams, router]);

  return (
    <div className="space-y-6">

      {/* KarmaCoin purchase banner */}
      {karmaBanner && (
        <div className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{
            backgroundColor: karmaBanner.status === "success" ? "var(--green-bg)"
                           : karmaBanner.status === "error"   ? "var(--red-bg)"
                           : "var(--blue-bg)",
            border: `1px solid ${
              karmaBanner.status === "success" ? "var(--green-border)"
            : karmaBanner.status === "error"   ? "var(--red-border)"
            : "var(--blue-border)"}`,
          }}>
          {karmaBanner.status === "loading" && (
            <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: "var(--blue-light)" }} />
          )}
          {karmaBanner.status === "success" && (
            <CheckCircle size={18} className="flex-shrink-0" style={{ color: "var(--green)" }} />
          )}
          {karmaBanner.status === "error" && (
            <Coins size={18} className="flex-shrink-0" style={{ color: "var(--red)" }} />
          )}
          <div>
            <p className="text-sm font-semibold" style={{
              color: karmaBanner.status === "success" ? "var(--green)"
                   : karmaBanner.status === "error"   ? "var(--red)"
                   : "var(--blue-light)",
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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>My Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Your activity overview</p>
        </div>
        <Button size="sm" onClick={() => setBuyModal(true)}>
          <Coins size={13} /> Buy KarmaCoins
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="KarmaCoins Balance"  value={balance}            icon={Coins}       color="amber" />
        <StatCard label="Registered Sessions" value={registeredMeetings} icon={Video}       color="teal"  />
        <StatCard label="My Orders"           value={orderCount}         icon={ShoppingBag} color="blue"  />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/user/meetings"
          className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:border-[color:var(--blue-border)]"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="rounded-xl p-3" style={{ backgroundColor: "var(--teal-bg)", color: "var(--teal)" }}>
            <Video size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Browse Meetings</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Join live healing sessions</p>
          </div>
        </Link>

        <Link href="/user/store"
          className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:border-[color:var(--blue-border)]"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="rounded-xl p-3" style={{ backgroundColor: "var(--blue-bg)", color: "var(--blue-light)" }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Store</p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Spend your KarmaCoins</p>
          </div>
        </Link>

        {!subscription ? (
          <Link href="/user/certification"
            className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--purple-bg)", border: "1px solid var(--purple-border)" }}
          >
            <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(168,85,247,0.2)", color: "var(--purple)" }}>
              <Award size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Become a Guide</p>
              <p className="text-xs" style={{ color: "var(--purple)" }}>Get certified · Host sessions</p>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl p-5 flex items-center gap-4"
            style={{ backgroundColor: "var(--green-bg)", border: "1px solid var(--green-border)" }}>
            <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(34,197,94,0.2)", color: "var(--green)" }}>
              <Award size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Certified Guide</p>
              <Badge color="green">${subscription.tier}/month · Active</Badge>
            </div>
          </div>
        )}
      </div>

      <BuyKarmaModal open={buyModal} onClose={() => setBuyModal(false)} />
    </div>
  );
}
