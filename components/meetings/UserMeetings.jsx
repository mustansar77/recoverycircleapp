"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Calendar, Clock, Users, Coins, CheckCircle, Lock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import Tabs from "@/components/ui/Tabs";

import ZoomSession from "./ZoomSession";

const STATUS_TABS = [
  { value: "all",          label: "All" },
  { value: "upcoming",     label: "Upcoming" },
  { value: "live",         label: "Live Now" },
  { value: "registered",   label: "Registered" },
];

const STATUS_COLOR = { upcoming: "blue", live: "green", ended: "gray", cancelled: "red" };

function MeetingCard({ meeting, onRegister, onJoin, registering }) {
  const isPast  = meeting.status === "ended" || meeting.status === "cancelled";
  const isLive  = meeting.status === "live";
  const isFull  = meeting.registration_count >= meeting.max_participants;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--surface)", border: `1px solid ${isLive ? "var(--green-border)" : "var(--border)"}` }}
    >
      {isLive && (
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "var(--green-bg)" }}>
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--green)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--green)" }}>LIVE NOW</span>
        </div>
      )}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>
            {meeting.title}
          </h3>
          <Badge color={STATUS_COLOR[meeting.status] ?? "gray"}>{meeting.status}</Badge>
        </div>

        {meeting.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-3)" }}>
            {meeting.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-3)" }}>
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date(meeting.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            {new Date(meeting.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            {meeting.registration_count}/{meeting.max_participants} seats
          </div>
          <div className="flex items-center gap-1.5">
            <Coins size={12} style={{ color: "var(--yellow)" }} />
            <span style={{ color: "var(--yellow)" }}>{meeting.karma_cost} KC to register</span>
          </div>
        </div>

        {meeting.host && (
          <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid var(--border-sub)" }}>
            <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
              {meeting.host.full_name?.[0]?.toUpperCase() ?? "G"}
            </div>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              Hosted by <span style={{ color: "var(--text-2)" }}>{meeting.host.full_name ?? meeting.host.email}</span>
            </span>
          </div>
        )}

        <div className="mt-auto pt-2">
          {isPast ? (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Session ended</span>
          ) : meeting.is_registered ? (
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--green)" }}>
                <CheckCircle size={13} /> Registered
              </div>
              <Button
                size="sm"
                variant={isLive ? "primary" : "secondary"}
                className="ml-auto"
                onClick={() => onJoin(meeting)}
                disabled={!isLive}
              >
                <Video size={13} />
                {isLive ? "Join Now" : "Not started yet"}
              </Button>
            </div>
          ) : isFull ? (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
              <Lock size={12} /> Session full
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onRegister(meeting)}
              disabled={registering === meeting.id}
            >
              <Coins size={13} />
              {registering === meeting.id ? "Registering…" : `Register (${meeting.karma_cost} KC)`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserMeetings({ initialBalance }) {
  const [meetings,    setMeetings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("all");
  const [registering, setRegistering] = useState(null);
  const [session,     setSession]     = useState(null); // { token, sessionName, displayName, isHost, meetingTitle }
  const [balance,     setBalance]     = useState(initialBalance ?? 0);
  const [toast,       setToast]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/meetings");
    setMeetings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleRegister(meeting) {
    setRegistering(meeting.id);
    const res  = await fetch(`/api/meetings/${meeting.id}/register`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); }
    else {
      setBalance(b => b - meeting.karma_cost);
      showToast(`Registered for "${meeting.title}"!`);
      load();
    }
    setRegistering(null);
  }

  async function handleJoin(meeting) {
    const res  = await fetch(`/api/meetings/${meeting.id}/token`);
    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }
    setSession({ ...data, meetingTitle: meeting.title });
  }

  const filtered = meetings.filter(m => {
    if (tab === "all")        return true;
    if (tab === "registered") return m.is_registered;
    return m.status === tab;
  });

  // Full-screen session view
  if (session) {
    return (
      <div className="fixed inset-0 z-50" style={{ backgroundColor: "var(--bg)" }}>
        <ZoomSession
          meetingNumber={session.meetingNumber}
          password={session.password}
          displayName={session.displayName}
          isHost={session.role === 1}
          meetingTitle={session.meetingTitle}
          onLeave={() => { setSession(null); load(); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Meetings</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Browse and join live healing sessions</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold"
          style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)", color: "var(--yellow)" }}>
          <Coins size={14} /> {balance} KC
        </div>
      </div>

      <Tabs tabs={STATUS_TABS} active={tab} onChange={setTab} />

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings found"
          description={tab === "registered" ? "Register for a meeting to see it here." : "No meetings available right now."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onRegister={handleRegister}
              onJoin={handleJoin}
              registering={registering}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
          style={toast.type === "error"
            ? { backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }
            : { backgroundColor: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }
          }
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
