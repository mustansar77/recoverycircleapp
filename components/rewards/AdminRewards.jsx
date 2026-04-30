"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Coins, Plus, Award } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input, { Select } from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const TH = ({ children }) => (
  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
    {children}
  </th>
);

export default function AdminRewards() {
  const [rewards,   setRewards]   = useState([]);
  const [guides,    setGuides]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [form,      setForm]      = useState({ receiver_id: "", amount: "", reason: "" });
  const { toasts, toast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [rRes, gRes] = await Promise.all([
      fetch("/api/admin/rewards"),
      fetch("/api/admin/users?role=guide"),
    ]);
    setRewards(await rRes.json());
    setGuides(await gRes.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openModal() {
    setForm({ receiver_id: "", amount: "", reason: "" });
    setError(""); setSuccess(false); setModal(true);
  }

  async function handleSubmit() {
    setSaving(true); setError("");
    const res  = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    const recipientName = guides.find(g => g.id === form.receiver_id)?.full_name ?? "Guide";
    setSaving(false); setSuccess(true);
    setTimeout(() => {
      setModal(false); setSuccess(false); load();
      toast(`${form.amount} KarmaCoins awarded to ${recipientName}`);
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>KarmaCoin Rewards</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Manually award KarmaCoins to guides and members</p>
        </div>
        <Button onClick={openModal} size="sm"><Gift size={13} /> Give KarmaCoins</Button>
      </div>

      {loading ? <PageSpinner /> : rewards.length === 0 ? (
        <EmptyState
          icon={Award} title="No rewards given yet"
          description="Award KarmaCoins to guides as a thank-you for great sessions."
          action={<Button size="sm" onClick={openModal}><Plus size={13} /> Give KarmaCoins</Button>}
        />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}>
                <tr><TH>Recipient</TH><TH>Amount</TH><TH>Meeting</TH><TH>Reason</TH><TH>Given By</TH><TH>Date</TH></tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rewards.map(r => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="transition-colors hover:bg-[color:var(--raised)]"
                      style={{ borderBottom: "1px solid var(--border-sub)" }}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium" style={{ color: "var(--text)" }}>
                          {r.receiver?.full_name ?? "—"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-3)" }}>{r.receiver?.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 font-bold" style={{ color: "var(--yellow)" }}>
                          <Coins size={13} />{r.amount}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-2)" }}>
                        {r.meeting?.title ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <p className="truncate text-sm" style={{ color: "var(--text-2)" }}>{r.reason ?? "—"}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-3)" }}>
                        {r.giver?.full_name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-3)" }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Give KarmaCoins" maxWidth="max-w-sm">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)" }}>
              <Coins size={26} style={{ color: "var(--yellow)" }} />
            </div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>KarmaCoins awarded!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select label="Recipient (Guide)" required value={form.receiver_id}
              onChange={e => setForm({ ...form, receiver_id: e.target.value })}>
              <option value="">— Select a guide —</option>
              {guides.map(g => (
                <option key={g.id} value={g.id}>
                  {g.full_name ?? g.email} ({g.karma_coins ?? 0} KC)
                </option>
              ))}
            </Select>
            <Input label="Amount (KarmaCoins)" required type="number" min="1"
              value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="10" />
            <Input label="Reason (optional)" value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Excellent session today!" />
            {error && (
              <p className="text-sm rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit}
                disabled={saving || !form.receiver_id || !form.amount}>
                <Gift size={13} /> {saving ? "Sending…" : "Award Coins"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
