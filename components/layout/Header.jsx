"use client";

import { useState } from "react";
import { Coins, Bell, Plus, Sun, Moon } from "lucide-react";
import BuyKarmaModal from "@/components/karma/BuyKarmaModal";
import { useTheme } from "@/components/layout/ThemeProvider";

const ROLE_LABEL = {
  superadmin: "Super Admin",
  admin: "Administrator",
  guide: "Guide",
  user: "Member",
};

export default function Header({ profile }) {
  const [buyModal, setBuyModal] = useState(false);
  const { theme, toggle } = useTheme();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? "?";

  const showKarma = profile?.role === "guide" || profile?.role === "user";

  return (
    <>
      <header
        className="flex h-14 flex-shrink-0 items-center justify-between px-6 gap-4"
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div />

        <div className="flex items-center gap-2">
          {/* KarmaCoins balance + Buy button — guides & members */}
          {showKarma && (
            <button
              onClick={() => setBuyModal(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: "var(--yellow-bg)",
                border: "1px solid var(--yellow-border)",
                color: "var(--yellow)",
              }}
            >
              <Coins size={13} />
              {profile?.karma_coins ?? 0}
              <span className="font-normal" style={{ color: "var(--text-3)" }}>KC</span>
              <span
                className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-white"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", fontSize: "10px" }}
              >
                <Plus size={9} strokeWidth={3} />
              </span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--hover)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--card)"}
          >
            {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Notifications */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--hover)"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--card)"}
          >
            <Bell size={14} />
          </button>

          {/* Divider */}
          <div className="mx-1 h-6 w-px" style={{ backgroundColor: "var(--border)" }} />

          {/* User info */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-sm leading-tight">
              <p className="font-semibold truncate max-w-[120px]" style={{ color: "var(--text)" }}>
                {profile?.full_name ?? profile?.email}
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                {ROLE_LABEL[profile?.role] ?? "Member"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {showKarma && (
        <BuyKarmaModal open={buyModal} onClose={() => setBuyModal(false)} />
      )}
    </>
  );
}
