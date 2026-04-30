"use client";

import { clsx } from "clsx";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div
      className="flex gap-0.5 rounded-xl p-1 flex-wrap"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "shadow-sm"
                : "hover:bg-[color:var(--raised)] hover:text-[color:var(--text-2)]"
            )}
            style={
              isActive
                ? {
                    backgroundColor: "var(--blue-bg)",
                    color: "var(--blue-light)",
                    border: "1px solid var(--blue-border)",
                  }
                : { color: "var(--text-3)", border: "1px solid transparent" }
            }
          >
            {tab.icon && <tab.icon size={13} />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="rounded-full px-1.5 py-px text-xs font-semibold"
                style={
                  isActive
                    ? { backgroundColor: "rgba(59,130,246,0.2)", color: "var(--blue-light)" }
                    : { backgroundColor: "var(--border)", color: "var(--text-3)" }
                }
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
