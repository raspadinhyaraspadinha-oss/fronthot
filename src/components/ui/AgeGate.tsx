"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AgeGateProps {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [show, setShow] = useState(true);

  const handleConfirm = () => {
    setShow(false);
    setTimeout(onConfirm, 400);
  };

  const handleDeny = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="glass relative w-full max-w-md overflow-hidden rounded-[var(--radius-xl)] p-8 text-center shadow-[var(--shadow-xl)]"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-600"
            >
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.959-1.333-2.73 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </motion.div>

            {/* Title */}
            <h2 className="mb-3 text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
              Conteúdo Adulto
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
              Este site contém material explícito destinado exclusivamente para maiores de 18 anos.
            </p>

            {/* Question */}
            <p className="mb-6 text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
              Você tem 18 anos ou mais?
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="flex-1 rounded-[var(--radius-lg)] bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
              >
                Sim, tenho 18+
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeny}
                className="flex-1 rounded-[var(--radius-lg)] border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-transparent px-6 py-3.5 text-base font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] transition-colors hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)]"
              >
                Não
              </motion.button>
            </div>

            {/* Footer */}
            <p className="mt-6 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
              Ao continuar, você confirma que é maior de idade e aceita os termos de uso.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
