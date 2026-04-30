"use client";

import { Hammer } from "lucide-react";

export default function UserStore() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)" }}
      >
        <Hammer size={36} style={{ color: "var(--yellow)" }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Store is Under Construction</h1>
        <p className="mt-2 text-sm max-w-sm" style={{ color: "var(--text-3)" }}>
          We're working hard to bring you something great. Check back soon!
        </p>
      </div>
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
      >
        🚧 &nbsp;Coming soon
      </div>
    </div>
  );
}
