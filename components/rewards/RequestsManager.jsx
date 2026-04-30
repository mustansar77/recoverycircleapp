"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Check, X, Coins, TrendingUp, Star } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const STATUS_TABS = [
  { value: "all",      label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLOR = { pending: "yellow", approved: "green", rejected: "red" };

const LEVEL_NAMES = [
  "", "Fresh Start Guide", "Pathway Pioneer",
  "Community Connector", "Hope Ambassador", "Recovery Visionary",
];

const TH = ({ children }) => (
  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
    {children}
  </th>
);

// ── KC Reward Requests ────────────────────────────────────────────────────
function KCRequestsPanel() {
  const [requests,   setRequests]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [statusTab,  setStatusTab] = useState("all");
  const [processing, setProc]      = useState(null);
  const { toasts, toast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/rewards/requests");
    setRequests(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleAction(id, action) {
    setProc(id + action);
    await fetch(`/api/rewards/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setProc(null);
    load();
    toast(action === "approve" ? "KC reward approved" : "KC reward rejected",
          action === "approve" ? "success" : "info");
  }

  const filtered = statusTab === "all" ? requests : requests.filter(r => r.status === statusTab);

  return (
    <div className="space-y-4">
      <Tabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />
      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Coins} title="No KC reward requests" description="Reward requests appear here after guide meetings end." />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}>
                <tr><TH>Guide</TH><TH>Meeting</TH><TH>Amount</TH><TH>Description</TH><TH>Status</TH><TH>Date</TH><TH>Actions</TH></tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(req => (
                    <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="transition-colors hover:bg-[color:var(--raised)]"
                      style={{ borderBottom: "1px solid var(--border-sub)" }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: "var(--purple-bg)", border: "1px solid var(--purple-border)" }}>
                            {(req.guide?.full_name ?? req.guide?.email)?.[0]?.toUpperCase() ?? "G"}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: "var(--text)" }}>{req.guide?.full_name ?? "—"}</p>
                            <p className="text-xs" style={{ color: "var(--text-3)" }}>{req.guide?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium" style={{ color: "var(--text)" }}>{req.meetings?.title ?? "—"}</p>
                        {req.meetings?.date && <p className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(req.meetings.date).toLocaleDateString()}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 font-bold" style={{ color: "var(--yellow)" }}>
                          <Coins size={13} />{req.amount}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-[180px]">
                        <p className="truncate text-sm" style={{ color: "var(--text-2)" }}>{req.description ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5"><Badge color={STATUS_COLOR[req.status]}>{req.status}</Badge></td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-3)" }}>
                        {new Date(req.created_at).toLocaleDateString()}
                        {req.processor && <p style={{ opacity: 0.7 }}>by {req.processor.full_name}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        {req.status === "pending" ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleAction(req.id, "approve")} disabled={!!processing}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110"
                              style={{ backgroundColor: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }}>
                              <Check size={11} /> Approve
                            </button>
                            <button onClick={() => handleAction(req.id, "reject")} disabled={!!processing}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110"
                              style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
                              <X size={11} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>Processed</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}

// ── Level-Up Requests ─────────────────────────────────────────────────────
function LevelRequestsPanel() {
  const [requests,   setRequests]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [statusTab,  setStatusTab] = useState("all");
  const [processing, setProc]      = useState(null);
  const { toasts, toast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/level-requests");
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleAction(id, action) {
    setProc(id + action);
    const res  = await fetch(`/api/level-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setProc(null);
    load();
    if (action === "approve") {
      toast(`${data.guide_name ?? "Guide"} promoted to ${data.level_name}`);
    } else {
      toast("Level-up request rejected", "info");
    }
  }

  const filtered = statusTab === "all" ? requests : requests.filter(r => r.status === statusTab);

  return (
    <div className="space-y-4">
      <Tabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />
      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No level-up requests"
          description="After a certification meeting ends, admin can generate a level-up request for the guide." />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}>
                <tr><TH>Guide</TH><TH>Current Level</TH><TH>Meeting</TH><TH>Requested By</TH><TH>Status</TH><TH>Date</TH><TH>Actions</TH></tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(req => {
                    const currentLevel = req.guide?.certification_level ?? 0;
                    const nextLevel    = Math.min(currentLevel + 1, 5);
                    return (
                      <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="transition-colors hover:bg-[color:var(--raised)]"
                        style={{ borderBottom: "1px solid var(--border-sub)" }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
                              {(req.guide?.full_name ?? req.guide?.email)?.[0]?.toUpperCase() ?? "G"}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: "var(--text)" }}>{req.guide?.full_name ?? "—"}</p>
                              <p className="text-xs" style={{ color: "var(--text-3)" }}>{req.guide?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Star size={11} style={{ color: "var(--yellow)" }} />
                              <span className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                                {currentLevel === 0 ? "Not certified" : LEVEL_NAMES[currentLevel]}
                              </span>
                            </div>
                            {req.status === "pending" && (
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--green)" }}>
                                <TrendingUp size={10} />
                                → {LEVEL_NAMES[nextLevel]}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium" style={{ color: "var(--text)" }}>{req.meeting?.title ?? "—"}</p>
                          {req.meeting?.date && <p className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(req.meeting.date).toLocaleDateString()}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-2)" }}>
                          {req.requester?.full_name ?? "—"}
                        </td>
                        <td className="px-5 py-3.5"><Badge color={STATUS_COLOR[req.status]}>{req.status}</Badge></td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-3)" }}>
                          {new Date(req.created_at).toLocaleDateString()}
                          {req.processor && <p style={{ opacity: 0.7 }}>by {req.processor.full_name}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          {req.status === "pending" ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleAction(req.id, "approve")} disabled={!!processing}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110"
                                style={{ backgroundColor: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }}>
                                <Check size={11} /> Approve
                              </button>
                              <button onClick={() => handleAction(req.id, "reject")} disabled={!!processing}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110"
                                style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
                                <X size={11} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-3)" }}>
                              {req.status === "approved" ? `→ ${LEVEL_NAMES[Math.min((req.guide?.certification_level ?? 0), 5)]}` : "Rejected"}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
const SECTION_TABS = [
  { value: "level", label: "Level-Up Requests", icon: TrendingUp },
  { value: "kc",    label: "KC Reward Requests", icon: Coins },
];

export default function RequestsManager() {
  const [section, setSection] = useState("level");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Requests</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Approve or reject guide level-up and reward requests</p>
      </div>

      <div className="flex gap-2">
        {SECTION_TABS.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setSection(value)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={section === value
              ? { backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }
              : { backgroundColor: "var(--card)", color: "var(--text-2)", border: "1px solid var(--border)" }
            }>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {section === "level" ? <LevelRequestsPanel /> : <KCRequestsPanel />}
    </div>
  );
}
