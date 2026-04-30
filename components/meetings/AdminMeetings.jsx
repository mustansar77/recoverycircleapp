"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Video, Calendar, Clock, Users, Pencil, Trash2, Coins, Gift, Award, TrendingUp, PhoneOff, Eye } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input, { Textarea, Select } from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import Tabs from "@/components/ui/Tabs";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import ZoomSession from "@/components/meetings/ZoomSession";
import MeetingDetailModal from "@/components/meetings/MeetingDetailModal";

const TYPE_TABS = [
  { value: "certification", label: "Certification Meetings", icon: Award },
  { value: "guide",         label: "Guide Meetings (View)",  icon: Video },
];

const STATUS_TABS = [
  { value: "all",      label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live",     label: "Live" },
  { value: "ended",    label: "Past" },
];

const STATUS_COLOR = { upcoming: "blue", live: "green", ended: "gray", cancelled: "red" };

const EMPTY_FORM = {
  title: "", description: "", type: "certification",
  date: "", duration_minutes: "60", max_participants: "50", karma_cost: "2",
  zoom_meeting_id: "", zoom_meeting_password: "",
};

function GiveKarmaModal({ open, onClose, meeting, onSuccess }) {
  const [guides,     setGuides]    = useState([]);
  const [receiverId, setReceiver]  = useState(meeting?.host_id ?? "");
  const [amount,     setAmount]    = useState("10");
  const [reason,     setReason]    = useState("");
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState("");
  const [success,    setSuccess]   = useState(false);

  useEffect(() => {
    if (!open) { setSuccess(false); setError(""); return; }
    fetch("/api/admin/users?role=guide").then(r => r.json()).then(setGuides);
    setReceiver(meeting?.host_id ?? "");
  }, [open, meeting]);

  async function handleSubmit() {
    setSaving(true); setError("");
    const res  = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: receiverId, amount: Number(amount), meeting_id: meeting?.id, reason }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    const recipientName = guides.find(g => g.id === receiverId)?.full_name ?? "Guide";
    setSuccess(true); setSaving(false);
    setTimeout(() => { setSuccess(false); onClose(); onSuccess?.(recipientName, amount); }, 1200);
  }

  return (
    <Modal open={open} onClose={onClose} title="Give KarmaCoins to Host" maxWidth="max-w-sm">
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
          {meeting && (
            <div className="rounded-xl px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
              Rewarding host for: <span className="font-semibold" style={{ color: "var(--text)" }}>{meeting.title}</span>
            </div>
          )}
          <Select label="Recipient" required value={receiverId} onChange={e => setReceiver(e.target.value)}>
            <option value="">— Select a guide —</option>
            {guides.map(g => (
              <option key={g.id} value={g.id}>{g.full_name ?? g.email}</option>
            ))}
          </Select>
          <Input label="Amount (KarmaCoins)" required type="number" min="1" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="10" />
          <Input label="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Excellent session today!" />
          {error && (
            <p className="text-sm rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving || !receiverId || !amount}>
              <Coins size={13} /> {saving ? "Sending…" : "Give Coins"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminMeetings() {
  const [meetings,   setMeetings]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [typeTab,    setTypeTab]   = useState("guide");
  const [statusTab,  setStatusTab] = useState("all");
  const [modal,      setModal]     = useState(false);
  const [editTarget, setEdit]      = useState(null);
  const [delTarget,  setDel]       = useState(null);
  const [rewardMtg,  setReward]    = useState(null);
  const [session,    setSession]   = useState(null);
  const [viewMeeting, setView]     = useState(null);
  const [saving,          setSaving]       = useState(false);
  const [updating,        setUpdating]     = useState(null);
  const [levelRequesting, setLvlReq]       = useState(null);
  const [error,           setError]        = useState("");
  const [form,            setForm]         = useState(EMPTY_FORM);
  const { toasts, toast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/meetings");
    setMeetings(await res.json());
    setLoading(false);
  }, []);

  async function handleJoin(meeting) {
    const res  = await fetch(`/api/meetings/${meeting.id}/token`);
    const data = await res.json();
    if (!res.ok) { toast(data.error, "error"); return; }
    setSession({ ...data, meetingTitle: meeting.title });
  }
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, type: "certification" });
    setError(""); setEdit(null); setModal(true);
  }
  function openEdit(m) {
    setForm({
      title:                 m.title,
      description:           m.description ?? "",
      type:                  m.type,
      date:                  new Date(m.date).toISOString().slice(0, 16),
      duration_minutes:      String(m.duration_minutes),
      max_participants:      String(m.max_participants),
      karma_cost:            String(m.karma_cost),
      zoom_meeting_id:       m.zoom_meeting_id ? String(m.zoom_meeting_id) : "",
      zoom_meeting_password: m.zoom_meeting_password ?? "",
    });
    setError(""); setEdit(m); setModal(true);
  }

  async function handleSave() {
    setSaving(true); setError("");
    const url    = editTarget ? `/api/meetings/${editTarget.id}` : "/api/meetings";
    const method = editTarget ? "PUT" : "POST";
    const body   = {
      title:                 form.title,
      description:           form.description,
      type:                  form.type,
      date:                  form.date,
      duration_minutes:      Number(form.duration_minutes),
      max_participants:      Number(form.max_participants),
      karma_cost:            Number(form.karma_cost),
      zoom_meeting_id:       form.zoom_meeting_id ? Number(form.zoom_meeting_id) : undefined,
      zoom_meeting_password: form.zoom_meeting_password || "",
    };
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setSaving(false); setModal(false); load();
    toast(editTarget ? `"${form.title}" updated` : `Meeting "${form.title}" created`);
  }

  async function handleDelete() {
    const title = delTarget.title;
    setSaving(true);
    await fetch(`/api/meetings/${delTarget.id}`, { method: "DELETE" });
    setSaving(false); setDel(null); load();
    toast(`"${title}" deleted`, "info");
  }

  async function handleStatusChange(id, status) {
    setUpdating(id);
    await fetch(`/api/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null); load();
    const msg = status === "live" ? "Session is now live" : "Session ended";
    toast(msg, status === "live" ? "success" : "info");
  }

  async function handleLevelRequest(meeting) {
    setLvlReq(meeting.id);
    const res  = await fetch("/api/level-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meeting.id }),
    });
    const data = await res.json();
    setLvlReq(null);
    if (!res.ok) { toast(data.error, "error"); return; }
    toast(`Level-up request sent for ${meeting.host?.full_name ?? "guide"} → ${data.next_level}`);
  }

  const byType   = meetings.filter(m => m.type === typeTab);
  const filtered = statusTab === "all" ? byType : byType.filter(m => m.status === statusTab);

  if (session) {
    return (
      <div className="fixed inset-0 z-50" style={{ backgroundColor: "var(--bg)" }}>
        <ZoomSession
          meetingNumber={session.meetingNumber}
          password={session.password}
          displayName={session.displayName}
          isHost={session.role === 1}
          meetingTitle={session.meetingTitle}
          onLeave={() => setSession(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Meetings</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            {typeTab === "certification" ? "Create and manage certification sessions" : "Read-only view of guide sessions"}
          </p>
        </div>
        {typeTab === "certification" && (
          <Button onClick={openCreate} size="sm"><Plus size={13} /> Create Meeting</Button>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        {TYPE_TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => { setTypeTab(value); setStatusTab("all"); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={typeTab === value
              ? { backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }
              : { backgroundColor: "var(--card)", color: "var(--text-2)", border: "1px solid var(--border)" }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <Tabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState
          icon={typeTab === "certification" ? Award : Video}
          title={`No ${typeTab} meetings`}
          description="Create a meeting and assign a guide as host."
          action={<Button size="sm" onClick={openCreate}><Plus size={13} /> Create Meeting</Button>}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(m => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl p-5"
                style={{ backgroundColor: "var(--surface)", border: `1px solid ${m.status === "live" ? "var(--green-border)" : "var(--border)"}` }}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-start gap-3 flex-wrap">
                      <h3 className="font-semibold" style={{ color: "var(--text)" }}>{m.title}</h3>
                      <Badge color={STATUS_COLOR[m.status] ?? "gray"}>{m.status}</Badge>
                      <Badge color={m.type === "certification" ? "purple" : "teal"}>
                        {m.type === "certification" ? "Certification" : "Guide"}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="text-xs line-clamp-1" style={{ color: "var(--text-3)" }}>{m.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-3)" }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}
                        {new Date(m.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1.5"><Clock size={12} />{m.duration_minutes} min</span>
                      <span className="flex items-center gap-1.5">
                        <Users size={12} />{m.registration_count ?? 0}/{m.max_participants}
                      </span>
                      <span className="flex items-center gap-1.5" style={{ color: "var(--yellow)" }}>
                        <Coins size={12} />{m.karma_cost} KC/seat
                      </span>
                    </div>
                    {typeTab === "guide" && m.host && (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
                          {m.host.full_name?.[0]?.toUpperCase() ?? "G"}
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-2)" }}>
                          {m.host.full_name ?? m.host.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 flex-wrap sm:flex-col sm:items-end">
                    {typeTab === "certification" && (
                      <>
                        {m.status === "upcoming" && (
                          <Button size="sm" variant="success" disabled={updating === m.id}
                            onClick={() => handleStatusChange(m.id, "live")}>
                            Go Live
                          </Button>
                        )}
                        {m.status === "live" && (
                          <>
                            <Button size="sm" onClick={() => handleJoin(m)}>
                              <Video size={12} /> Join
                            </Button>
                            <Button size="sm" variant="danger" disabled={updating === m.id}
                              onClick={() => handleStatusChange(m.id, "ended")}>
                              <PhoneOff size={12} /> End Session
                            </Button>
                          </>
                        )}
                        {m.status === "ended" && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => setView(m)}>
                              <Eye size={12} /> View
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setReward(m)}>
                              <Gift size={12} /> Give KC
                            </Button>
                            <Button size="sm" variant="secondary"
                              disabled={levelRequesting === m.id}
                              onClick={() => handleLevelRequest(m)}>
                              <TrendingUp size={12} />
                              {levelRequesting === m.id ? "Sending…" : "Level Up Request"}
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                          <Pencil size={12} /> Edit
                        </Button>
                        <button
                          onClick={() => setDel(m)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--red-bg)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red-border)"; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--card)"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                    {typeTab === "guide" && m.status === "ended" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setView(m)}>
                          <Eye size={12} /> View
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setReward(m)}>
                          <Gift size={12} /> Give KC
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? "Edit Meeting" : "Create Meeting"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Morning Healing Circle" />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this session covers…" />
          <Input label="Date &amp; Time" required type="datetime-local" value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Duration (min)" type="number" min="15" value={form.duration_minutes}
              onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
            <Input label="Max Participants" type="number" min="1" value={form.max_participants}
              onChange={e => setForm({ ...form, max_participants: e.target.value })} />
            <Input label="KC Cost / Seat" type="number" min="0" value={form.karma_cost}
              onChange={e => setForm({ ...form, karma_cost: e.target.value })} />
          </div>

          {/* Zoom Meeting Details */}
          <div className="rounded-xl p-3 space-y-3" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Zoom Meeting (optional — auto-created if credentials are configured)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Zoom Meeting ID" type="text" value={form.zoom_meeting_id}
                placeholder="e.g. 123 456 7890"
                onChange={e => setForm({ ...form, zoom_meeting_id: e.target.value.replace(/\s/g, "") })} />
              <Input label="Zoom Password" type="text" value={form.zoom_meeting_password}
                placeholder="optional"
                onChange={e => setForm({ ...form, zoom_meeting_password: e.target.value })} />
            </div>
          </div>

          {error && (
            <p className="text-sm rounded-xl px-3 py-2.5"
              style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Meeting"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!delTarget} onClose={() => setDel(null)} onConfirm={handleDelete}
        loading={saving} title="Delete Meeting" message={`Delete "${delTarget?.title}"? This cannot be undone.`} />

      <GiveKarmaModal open={!!rewardMtg} onClose={() => { setReward(null); load(); }} meeting={rewardMtg}
        onSuccess={(name, amount) => toast(`${amount} KC awarded to ${name}`)} />
      <MeetingDetailModal meeting={viewMeeting} onClose={() => setView(null)} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
