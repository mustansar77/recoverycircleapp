"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Video, PhoneOff, RefreshCw } from "lucide-react";

export default function ZoomSession({
  meetingNumber,
  password,
  displayName,
  isHost,
  meetingTitle,
  onLeave,
}) {
  const [launched, setLaunched] = useState(false);

  const zoomUrl = `https://zoom.us/wc/${meetingNumber}/join?pwd=${encodeURIComponent(password ?? "")}&prefer=1&uname=${encodeURIComponent(displayName ?? "")}`;

  function openZoom() {
    window.open(zoomUrl, "_blank", "noopener,noreferrer");
    setLaunched(true);
  }

  // Auto-launch on mount
  useEffect(() => {
    openZoom();
  }, []);

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: "var(--bg)" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{meetingTitle}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {isHost ? "You are the host" : "Attendee"} · Meeting #{meetingNumber}
          </p>
        </div>
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
          style={{ backgroundColor: "var(--red)" }}
        >
          <PhoneOff size={13} /> Leave
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">

        {/* Pulse icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: "var(--green)" }} />
          <div className="relative h-20 w-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--green-bg)", border: "2px solid var(--green-border)" }}>
            <Video size={32} style={{ color: "var(--green)" }} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {launched ? "Meeting is open in a new tab" : "Opening Zoom…"}
          </p>
          <p className="text-sm max-w-sm" style={{ color: "var(--text-3)" }}>
            {isHost
              ? "Log in to your Zoom account in the new tab to start the meeting as host."
              : "Join the meeting in the Zoom tab that just opened."}
          </p>
        </div>

        {/* Meeting details card */}
        <div className="rounded-2xl px-6 py-4 space-y-2 w-full max-w-xs"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-3)" }}>Meeting ID</span>
            <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{meetingNumber}</span>
          </div>
          {password && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-3)" }}>Password</span>
              <span className="font-mono font-semibold" style={{ color: "var(--text)" }}>{password}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-3)" }}>Your name</span>
            <span className="font-semibold" style={{ color: "var(--text)" }}>{displayName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={openZoom}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: "var(--blue-bg)", color: "var(--blue-light)", border: "1px solid var(--blue-border)" }}
          >
            <RefreshCw size={14} /> Reopen Zoom
          </button>
          <a
            href={zoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: "var(--card)", color: "var(--text-2)", border: "1px solid var(--border)" }}
          >
            <ExternalLink size={14} /> Open in new tab
          </a>
        </div>

        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          When you&apos;re done, click <strong>Leave</strong> above to return to the dashboard.
        </p>
      </div>
    </div>
  );
}
