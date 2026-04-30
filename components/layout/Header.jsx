"use client";

import { Coins, Bell } from "lucide-react";

const ROLE_LABEL = {
  superadmin: "Super Admin",
  admin: "Administrator",
  guide: "Guide",
  user: "Member",
};

export default function Header({ profile }) {
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between px-6 gap-4"
      style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left spacer / breadcrumb area */}
      <div />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* KarmaCoins — guides & members */}
        {(profile?.role === "guide" || profile?.role === "user") && (
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
            style={{
              backgroundColor: "var(--yellow-bg)",
              border: "1px solid var(--yellow-border)",
              color: "var(--yellow)",
            }}
          >
            <Coins size={13} />
            {profile?.karma_coins ?? 0}
            <span className="font-normal" style={{ color: "var(--text-3)" }}>KC</span>
          </div>
        )}

        {/* Notifications */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-[color:var(--hover)]"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text-3)",
          }}
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
  );
}
