"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface AgeGateProps {
  onConfirm: () => void;
}

/**
 * Age Gate — primeiro gatilho do funil.
 * Psicologia: Comprometimento + Consistência (Cialdini).
 * Ao clicar "Sim", o usuário faz um micro-compromisso que
 * aumenta a probabilidade de continuar no funil.
 */
export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [show, setShow] = useState(true);

  const handleConfirm = () => {
    setShow(false);
    setTimeout(onConfirm, 350);
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
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-5"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="w-full max-w-[360px] overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl"
          >
            {/* Conteúdo */}
            <div className="px-6 pt-8 pb-6 text-center">
              {/* Badge 18+ */}
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.15,
                  type: "spring",
                  stiffness: 400,
                  damping: 18,
                }}
                className="mx-auto mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/25"
              >
                <span className="text-[26px] font-black leading-none text-red-500">
                  18+
                </span>
              </motion.div>

              <h2 className="mb-2 text-xl font-bold tracking-tight text-white">
                Conteúdo Restrito
              </h2>
              <p className="mb-7 text-[13px] leading-relaxed text-zinc-400">
                Este site contém material explícito destinado exclusivamente
                para maiores de 18 anos.
              </p>

              {/* Pergunta */}
              <p className="mb-5 text-[15px] font-semibold text-zinc-200">
                Você tem 18 anos ou mais?
              </p>

              {/* Botões — empilhados no mobile, lado a lado em sm+ */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-[14px] text-[15px] font-bold text-white shadow-lg shadow-red-500/20 transition-shadow active:shadow-none"
                >
                  Sim, tenho 18+
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeny}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/60 py-[14px] text-[15px] font-semibold text-zinc-400 transition-colors active:bg-zinc-700"
                >
                  Não, sair
                </motion.button>
              </div>
            </div>

            {/* Rodapé */}
            <div className="border-t border-white/[0.05] px-6 py-3">
              <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                Ao continuar, você confirma que é maior de idade e aceita os
                termos de uso.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
