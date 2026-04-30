"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, Calendar, Clock, Users, Coins, Award, Eye } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import Tabs from "@/components/ui/Tabs";
import MeetingDetailModal from "@/components/meetings/MeetingDetailModal";

const TYPE_TABS = [
  { value: "guide",         label: "Guide Meetings" },
  { value: "certification", label: "Certification Meetings" },
];

const STATUS_TABS = [
  { value: "all",      label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live",     label: "Live" },
  { value: "ended",    label: "Past" },
];

const STATUS_COLOR = { upcoming: "blue", live: "green", ended: "gray", cancelled: "red" };

export default function SuperAdminMeetings() {
  const [meetings,     setMeetings]  = useState([]);
  const [loading,      setLoading]   = useState(true);
  const [typeTab,      setTypeTab]   = useState("guide");
  const [statusTab,    setStatusTab] = useState("all");
  const [viewMeeting,  setView]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/meetings");
    const data = await res.json();
    setMeetings(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = meetings.filter(m =>
    m.type === typeTab &&
    (statusTab === "all" || m.status === statusTab)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Meetings Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
          Click any row to view full details and attendees
        </p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2">
        {TYPE_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setTypeTab(value); setStatusTab("all"); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={typeTab === value
              ? { backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }
              : { backgroundColor: "var(--card)", color: "var(--text-2)", border: "1px solid var(--border)" }
            }
          >
            {value === "certification" ? <Award size={14} /> : <Video size={14} />}
            {label}
          </button>
        ))}
      </div>

      <Tabs tabs={STATUS_TABS} active={statusTab} onChange={setStatusTab} />

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState
          icon={typeTab === "certification" ? Award : Video}
          title={`No ${statusTab === "all" ? "" : statusTab + " "}${typeTab} meetings`}
          description="Nothing to show here yet."
        />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                {["Title", "Host", "Date", "Duration", "Members", "KC/Seat", "Status", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.id}
                  onClick={() => setView(m)}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: i % 2 === 0 ? "var(--surface)" : "var(--card)",
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--border-sub)" : undefined,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = i % 2 === 0 ? "var(--surface)" : "var(--card)"; }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--text)" }}>{m.title}</p>
                    {m.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-3)" }}>{m.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}>
                        {m.host?.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span style={{ color: "var(--text-2)" }}>{m.host?.full_name ?? m.host?.email ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} style={{ color: "var(--text-3)" }} />
                      {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {new Date(m.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: "var(--text-3)" }} />
                      {m.duration_minutes} min
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color: "var(--text-3)" }} />
                      {m.registration_count ?? 0}/{m.max_participants}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--yellow)" }}>
                      <Coins size={12} />
                      {m.karma_cost} KC
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLOR[m.status] ?? "gray"}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={e => { e.stopPropagation(); setView(m); }}
                    >
                      <Eye size={12} /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MeetingDetailModal meeting={viewMeeting} onClose={() => setView(null)} />
    </div>
  );
}
