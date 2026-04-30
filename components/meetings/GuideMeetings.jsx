"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Calendar, Clock, Users, Coins, Plus, Pencil, Trash2, Award, Check } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input, { Textarea } from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";

import ZoomSession from "./ZoomSession";

const STATUS_COLOR = { upcoming: "blue", live: "green", ended: "gray", cancelled: "red" };

const STATUS_TABS = [
  { value: "all",      label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live",     label: "Live" },
  { value: "ended",    label: "Past" },
];

const EMPTY_FORM = { title: "", description: "", date: "", duration_minutes: "60", max_participants: "50", karma_cost: "2" };

// ── My Guide Meetings (guide creates + hosts) ─────────────────────────────
function MyMeetings({ balance, setBalance, session, setSession, toast }) {
  const [meetings,   setMeetings]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [statusTab,  setStatusTab] = useState("all");
  const [modal,      setModal]     = useState(false);
  const [editTarget, setEdit]      = useState(null);
  const [delTarget,  setDel]       = useState(null);
  const [saving,     setSaving]    = useState(false);
  const [updating,   setUpdating]  = useState(null);
  const [error,      setError]     = useState("");
  const [form,       setForm]      = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/meetings?type=guide&host_me=1");
    setMeetings(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(EMPTY_FORM); setError(""); setEdit(null); setModal(true); }
  function openEdit(m) {
    setForm({
      title: m.title, description: m.description ?? "",
      date: new Date(m.date).toISOString().slice(0, 16),
      duration_minutes: String(m.duration_minutes),
      max_participants: String(m.max_participants),
      karma_cost: String(m.karma_cost),
    });
    setError(""); setEdit(m); setModal(true);
  }

  async function handleSave() {
    setSaving(true); setError("");
    const url    = editTarget ? `/api/meetings/${editTarget.id}` : "/api/meetings";
    const method = editTarget ? "PUT" : "POST";
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form, type: "guide",
        duration_minutes: Number(form.duration_minutes),
        max_participants: Number(form.max_participants),
        karma_cost: Number(form.karma_cost),
      }),
    });
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
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null); load();
    toast(status === "live" ? "Session is now live" : "Session ended", status === "live" ? "success" : "info");
  }

  async function handleJoin(meeting) {
    const res  = await fetch(`/api/meetings/${meeting.id}/token`);
    const data = await res.json();
    if (!res.ok) { toast(data.error, "error"); return; }
    setSession({ ...data, meetingTitle: meeting.title });
  }

  const filtered = statusTab === "all" ? meetings : meetings.filter(m => m.status === statusTab);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
          Meetings you create and host for members
        </p>
        <Button size="sm" onClick={openCreate}><Plus size={13} /> Create Meeting</Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setStatusTab(t.value)}
            className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
            style={statusTab === t.value
              ? { backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }
              : { backgroundColor: "var(--card)", color: "var(--text-2)", border: "1px solid var(--border)" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Video} title="No guide meetings yet"
          description="Create your first meeting for members to join."
          action={<Button size="sm" onClick={openCreate}><Plus size={13} /> Create Meeting</Button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4"
              style={{ backgroundColor: "var(--surface)", border: `1px solid ${m.status === "live" ? "var(--green-border)" : "var(--border)"}` }}>
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3 flex-wrap">
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>{m.title}</h3>
                  <Badge color={STATUS_COLOR[m.status] ?? "gray"}>{m.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-3)" }}>
                  <span className="flex items-center gap-1.5"><Calendar size={12} />
                    {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}{new Date(m.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1.5"><Clock size={12} />{m.duration_minutes} min</span>
                  <span className="flex items-center gap-1.5"><Users size={12} />{m.registration_count ?? 0}/{m.max_participants}</span>
                  <span className="flex items-center gap-1.5" style={{ color: "var(--yellow)" }}><Coins size={12} />{m.karma_cost} KC/seat</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-col sm:items-end">
                {m.status === "upcoming" && (
                  <>
                    <Button size="sm" variant="success" disabled={updating === m.id}
                      onClick={() => handleStatusChange(m.id, "live")}>Start</Button>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(m)}><Pencil size={12} /></Button>
                    <button onClick={() => setDel(m)} className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--red-bg)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red-border)"; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--card)"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
                {m.status === "live" && (
                  <>
                    <Button size="sm" onClick={() => handleJoin(m)}><Video size={13} /> Join</Button>
                    <Button size="sm" variant="danger" disabled={updating === m.id}
                      onClick={() => handleStatusChange(m.id, "ended")}>End</Button>
                  </>
                )}
                {m.status === "ended" && (
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>Ended</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? "Edit Meeting" : "Create Guide Meeting"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Morning Healing Circle" />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What this session covers…" />
          <Input label="Date & Time" required type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Duration (min)" type="number" min="15" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
            <Input label="Max Participants" type="number" min="1" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} />
            <Input label="KC Cost / Seat" type="number" min="0" value={form.karma_cost} onChange={e => setForm({ ...form, karma_cost: e.target.value })} />
          </div>
          {error && <p className="text-sm rounded-xl px-3 py-2.5"
            style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Meeting"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!delTarget} onClose={() => setDel(null)} onConfirm={handleDelete}
        loading={saving} title="Delete Meeting" message={`Delete "${delTarget?.title}"?`} />
    </div>
  );
}

// ── Certification Meetings (admin-created, guide attends) ─────────────────
function CertificationMeetings({ balance, setBalance, session, setSession, toast }) {
  const [meetings,    setMeetings]   = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [statusTab,   setStatusTab]  = useState("upcoming");
  const [registering, setRegistering] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/meetings?type=certification");
    setMeetings(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleJoin(meeting) {
    const res  = await fetch(`/api/meetings/${meeting.id}/token`);
    const data = await res.json();
    if (!res.ok) { toast(data.error, "error"); return; }
    setSession({ ...data, meetingTitle: meeting.title });
  }

  async function handleRegister(meeting) {
    setRegistering(meeting.id);
    const res  = await fetch(`/api/meetings/${meeting.id}/register`, { method: "POST" });
    const data = await res.json();
    setRegistering(null);
    if (!res.ok) { toast(data.error, "error"); return; }
    setBalance(b => b - (data.karma_spent ?? 0));
    toast(`Registered for "${meeting.title}"`, "success");
    load();
  }

  async function handleUnregister(meeting) {
    setRegistering(meeting.id);
    const res  = await fetch(`/api/meetings/${meeting.id}/register`, { method: "DELETE" });
    const data = await res.json();
    setRegistering(null);
    if (!res.ok) { toast(data.error, "error"); return; }
    setBalance(b => b + (data.refunded ?? 0));
    toast(`Unregistered — ${data.refunded ?? 0} KC refunded`, "info");
    load();
  }

  const filtered = meetings.filter(m => statusTab === "all" ? true : m.status === statusTab);

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
        Sessions created by admin — between you and the admin team
      </p>

      <div className="flex gap-2 flex-wrap">
        {[{ value: "upcoming", label: "Upcoming" }, { value: "live", label: "Live" }, { value: "ended", label: "Past" }].map(t => (
          <button key={t.value} onClick={() => setStatusTab(t.value)}
            className="rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
            style={statusTab === t.value
              ? { backgroundColor: "var(--purple-bg)", color: "var(--purple)", border: "1px solid var(--purple-border)" }
              : { backgroundColor: "var(--card)", color: "var(--text-2)", border: "1px solid var(--border)" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Award} title="No certification meetings"
          description="Admin will schedule certification sessions for you." />
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4"
              style={{ backgroundColor: "var(--surface)", border: `1px solid ${m.status === "live" ? "var(--purple-border)" : "var(--border)"}` }}>
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3 flex-wrap">
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>{m.title}</h3>
                  <Badge color={STATUS_COLOR[m.status] ?? "gray"}>{m.status}</Badge>
                  <Badge color="purple">Certification</Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-3)" }}>
                  <span className="flex items-center gap-1.5"><Calendar size={12} />
                    {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}{new Date(m.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1.5"><Clock size={12} />{m.duration_minutes} min</span>
                  {m.karma_cost > 0 && (
                    <span className="flex items-center gap-1.5" style={{ color: "var(--yellow)" }}>
                      <Coins size={12} />{m.karma_cost} KC
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                {m.status === "upcoming" && (
                  m.is_registered ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }}>
                        <Check size={12} /> Registered
                      </div>
                      <Button size="sm" variant="secondary"
                        disabled={registering === m.id}
                        onClick={() => handleUnregister(m)}>
                        {registering === m.id ? "…" : "Cancel"}
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm"
                      disabled={registering === m.id || balance < (m.karma_cost ?? 0)}
                      onClick={() => handleRegister(m)}>
                      {registering === m.id ? "Registering…" : (
                        m.karma_cost > 0
                          ? <><Coins size={12} /> Register · {m.karma_cost} KC</>
                          : "Register"
                      )}
                    </Button>
                  )
                )}
                {m.status === "live" && (
                  <Button size="sm" onClick={() => handleJoin(m)}><Video size={13} /> Join</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────
export default function GuideMeetings({ initialBalance }) {
  const [section, setSection] = useState("my");
  const [session, setSession] = useState(null);
  const [balance, setBalance] = useState(initialBalance ?? 0);
  const { toasts, toast, dismiss } = useToast();

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
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Manage and join your sessions</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold"
          style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", color: "var(--yellow)" }}>
          <Coins size={14} /> {balance} KC
        </div>
      </div>

      {/* Section toggle */}
      <div className="flex gap-2">
        {[
          { value: "my",   label: "My Guide Meetings", icon: Video },
          { value: "cert", label: "Certification Meetings", icon: Award },
        ].map(({ value, label, icon: Icon }) => (
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

      {section === "my"
        ? <MyMeetings balance={balance} setBalance={setBalance} session={session} setSession={setSession} toast={toast} />
        : <CertificationMeetings balance={balance} setBalance={setBalance} session={session} setSession={setSession} toast={toast} />
      }

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
