"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Coins, User, Award, Video, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";

const STATUS_COLOR = { upcoming: "blue", live: "green", ended: "gray", cancelled: "red" };

export default function MeetingDetailModal({ meeting, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!meeting) { setAttendees([]); return; }
    setAttendees([]);
    setLoading(true);
    fetch(`/api/meetings/${meeting.id}/attendees`)
      .then(async r => {
        const data = await r.json();
        setAttendees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setAttendees([]); setLoading(false); });
  }, [meeting?.id]);

  if (!meeting) return null;

  const isCert = meeting.type === "certification";

  return (
    <Modal
      open={!!meeting}
      onClose={onClose}
      title="Meeting Details"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">

        {/* Header — title + badges */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <Badge color={isCert ? "purple" : "teal"}>
              {isCert ? <><Award size={10} className="inline mr-1" />Certification</> : <><Video size={10} className="inline mr-1" />Guide</>}
            </Badge>
            <Badge color={STATUS_COLOR[meeting.status] ?? "gray"}>{meeting.status}</Badge>
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{meeting.title}</h2>
          {meeting.description && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-3)" }}>{meeting.description}</p>
          )}
        </div>

        {/* Meta grid */}
        <div
          className="grid grid-cols-2 gap-3 rounded-xl p-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <MetaItem icon={Calendar} label="Date">
            {new Date(meeting.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </MetaItem>
          <MetaItem icon={Clock} label="Time">
            {new Date(meeting.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </MetaItem>
          <MetaItem icon={Clock} label="Duration">
            {meeting.duration_minutes} minutes
          </MetaItem>
          <MetaItem icon={Users} label="Capacity">
            {meeting.registration_count ?? 0} / {meeting.max_participants} joined
          </MetaItem>
          <MetaItem icon={Coins} label="KC / Seat" className="col-span-2">
            <span style={{ color: "var(--yellow)" }}>{meeting.karma_cost} KarmaCoins</span>
          </MetaItem>
        </div>

        {/* Host */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Host</p>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}
            >
              {meeting.host?.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                {meeting.host?.full_name ?? "—"}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                {meeting.host?.email ?? ""}
              </p>
            </div>
          </div>
        </div>

        {/* Attendees */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              Registered Members
            </p>
            {!loading && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }}
              >
                {attendees.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-4"><PageSpinner /></div>
          ) : attendees.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-xl py-6 text-center"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <Users size={22} style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-3)" }}>No registered members yet</p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)", maxHeight: "220px", overflowY: "auto" }}
            >
              {attendees.map((reg, i) => (
                <div
                  key={reg.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderBottom: i < attendees.length - 1 ? "1px solid var(--border-sub)" : undefined,
                    backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--card)",
                  }}
                >
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
                  >
                    {reg.user?.full_name?.[0]?.toUpperCase() ?? <User size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                      {reg.user?.full_name ?? "—"}
                    </p>
                    <p className="text-xs truncate flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                      <Mail size={10} />{reg.user?.email ?? ""}
                    </p>
                  </div>
                  {reg.karma_spent > 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: "var(--yellow)" }}>
                      <Coins size={11} />{reg.karma_spent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}

function MetaItem({ icon: Icon, label, children, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>
        <Icon size={11} className="inline mr-1" />{label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{children}</p>
    </div>
  );
}
