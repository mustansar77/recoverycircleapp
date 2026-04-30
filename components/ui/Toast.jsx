"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

const STYLES = {
  success: { bg: "var(--green-bg)",  border: "var(--green-border)",  color: "var(--green)"  },
  error:   { bg: "var(--red-bg)",    border: "var(--red-border)",    color: "var(--red)"    },
  info:    { bg: "var(--blue-bg)",   border: "var(--blue-border)",   color: "var(--blue-light)" },
};

function ToastItem({ id, type = "success", message, onDismiss }) {
  const Icon  = ICONS[type]  ?? ICONS.info;
  const style = STYLES[type] ?? STYLES.info;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 3500);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 12, scale: 0.95  }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl min-w-[260px] max-w-sm"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: style.color }} />
      <p className="flex-1 text-sm font-medium leading-snug" style={{ color: "var(--text)" }}>
        {message}
      </p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 rounded-md p-0.5 transition-opacity opacity-60 hover:opacity-100"
        style={{ color: "var(--text-3)" }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, type = "success") => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  return { toasts, toast, dismiss };
}
