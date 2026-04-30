"use client";

import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  loading,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title ?? "Confirm Action"} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-5 text-center">
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: "var(--red-bg)", border: "1px solid var(--red-border)" }}
        >
          <AlertTriangle size={24} style={{ color: "var(--red)" }} />
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
          {message ?? "Are you sure? This action cannot be undone."}
        </p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
