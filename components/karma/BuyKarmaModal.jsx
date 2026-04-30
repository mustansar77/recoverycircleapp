"use client";

import { useState } from "react";
import { Coins, Zap, Star, Crown, Sliders } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Rate: $1 = 1 KarmaCoin
const BUNDLES = [
  { id: 1, icon: Zap,   label: "Starter",    coins: 5,   usd: 5,  color: "blue" },
  { id: 2, icon: Star,  label: "Popular",    coins: 10,  usd: 10, popular: true, color: "purple" },
  { id: 3, icon: Crown, label: "Best Value", coins: 25,  usd: 25, color: "teal" },
];

const iconColors = {
  blue:   { backgroundColor: "var(--blue-bg)",   color: "var(--blue-light)" },
  purple: { backgroundColor: "var(--purple-bg)", color: "var(--purple)" },
  teal:   { backgroundColor: "var(--teal-bg)",   color: "var(--teal)" },
};

async function checkout(karmaBundles) {
  const res  = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "karma", karmaBundles }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Checkout failed");
  return data.url;
}

export default function BuyKarmaModal({ open, onClose }) {
  const [loading,     setLoading]     = useState(null); // bundle id or "custom"
  const [customCoins, setCustomCoins] = useState("");
  const [error,       setError]       = useState("");

  // Custom: $1 = 1 KC, min 1
  const customNum   = parseInt(customCoins, 10);
  const customValid = !isNaN(customNum) && customNum >= 1;
  const customUsd   = customValid ? customNum : 0; // 1:1 rate

  async function handleBundle(bundle) {
    setError(""); setLoading(bundle.id);
    try {
      const url = await checkout(bundle.usd);
      if (url) window.location.href = url;
    } catch (e) { setError(e.message); }
    setLoading(null);
  }

  async function handleCustom() {
    if (!customValid) return;
    setError(""); setLoading("custom");
    try {
      const url = await checkout(customUsd);
      if (url) window.location.href = url;
    } catch (e) { setError(e.message); }
    setLoading(null);
  }

  return (
    <Modal open={open} onClose={onClose} title="Buy KarmaCoins" maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm"
          style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", color: "var(--yellow)" }}>
          <Coins size={14} />
          <span className="font-medium">$1 = 1 KarmaCoins · Use KC to join sessions &amp; shop the store</span>
        </div>

        {/* Preset bundles */}
        <div className="space-y-3">
          {BUNDLES.map(bundle => (
            <button
              key={bundle.id}
              onClick={() => handleBundle(bundle)}
              disabled={!!loading}
              className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all disabled:opacity-50 hover:border-[color:var(--blue)]"
              style={{
                backgroundColor: bundle.popular ? "var(--blue-bg)" : "var(--card)",
                border: bundle.popular ? "1px solid var(--blue-border)" : "1px solid var(--border)",
              }}
            >
              <div className="rounded-xl p-2.5 flex-shrink-0" style={iconColors[bundle.color]}>
                <bundle.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{bundle.label}</p>
                  {bundle.popular && (
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium"
                      style={{ backgroundColor: "var(--blue)", color: "#fff" }}>
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Coins size={13} style={{ color: "var(--yellow)" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--yellow)" }}>{bundle.coins} KarmaCoins</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold" style={{ color: "var(--text)" }}>${bundle.usd}</p>
                {loading === bundle.id && (
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Redirecting…</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>or enter a custom amount</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        </div>

        {/* Custom amount */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sliders size={15} style={{ color: "var(--text-3)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Custom Amount</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="1"
                value={customCoins}
                onChange={e => setCustomCoins(e.target.value)}
                placeholder="e.g. 30"
                className="w-full rounded-xl px-3 py-2.5 pr-20 text-sm outline-none"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
                onBlur={e =>  { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                style={{ color: "var(--yellow)" }}
              >
                KC
              </span>
            </div>

            {/* Live price preview */}
            <div
              className="flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold min-w-[60px] text-center"
              style={{
                backgroundColor: customValid ? "var(--green-bg)" : "var(--raised)",
                border: `1px solid ${customValid ? "var(--green-border)" : "var(--border)"}`,
                color: customValid ? "var(--green)" : "var(--text-3)",
              }}
            >
              {customValid ? `$${customUsd}` : "$—"}
            </div>
          </div>

          {customCoins !== "" && !customValid && (
            <p className="text-xs" style={{ color: "var(--red)" }}>Minimum 1 KarmaCoin</p>
          )}

          <Button
            className="w-full"
            onClick={handleCustom}
            disabled={!customValid || !!loading}
          >
            <Coins size={13} />
            {loading === "custom"
              ? "Redirecting…"
              : customValid
              ? `Buy ${customNum} KC for $${customUsd}`
              : "Buy Custom Amount"}
          </Button>
        </div>

        {error && (
          <p className="text-sm rounded-xl px-3 py-2.5 text-center"
            style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
            {error}
          </p>
        )}

        <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
          Secure payment via Stripe · KarmaCoins added instantly after payment
        </p>
      </div>
    </Modal>
  );
}
