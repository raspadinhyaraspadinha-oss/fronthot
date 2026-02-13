"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ToastMessage {
  id: string;
  text: string;
  type?: "info" | "success" | "error";
}

let addToastFn: ((msg: Omit<ToastMessage, "id">) => void) | null = null;

export function showToast(text: string, type: ToastMessage["type"] = "info") {
  addToastFn?.({ text, type });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...msg, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  const bgColor = {
    info: "bg-[var(--color-surface-dark)] text-white dark:bg-[var(--color-surface)] dark:text-[var(--color-text)]",
    success: "bg-[var(--color-success)] text-white",
    error: "bg-[var(--color-danger)] text-white",
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`rounded-[var(--radius-pill)] px-5 py-3 text-sm font-medium shadow-[var(--shadow-lg)] ${bgColor[t.type || "info"]}`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
