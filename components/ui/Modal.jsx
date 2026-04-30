"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(4, 8, 20, 0.8)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden`}
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)",
            }}
          >
            {/* Top accent */}
            <div
              className="h-px w-full"
              style={{ background: "linear-gradient(90deg, var(--blue) 0%, var(--blue-dark) 50%, transparent 100%)" }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-sub)" }}
            >
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[color:var(--hover)]"
                style={{ color: "var(--text-3)" }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
