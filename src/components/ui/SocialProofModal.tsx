"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface SocialProofModalProps {
  onContinue: () => void;
}

/**
 * Social Proof Modal — segundo gatilho do funil.
 *
 * Princípios de Cialdini aplicados:
 * - Prova Social: screenshot real com comentários de usuários
 * - Escassez: números de vagas / vídeos limitados
 * - Urgência: contador de pessoas desbloqueando em tempo real
 * - Reciprocidade: 3 créditos grátis antes de pedir qualquer coisa
 *
 * UX: Bottom-sheet no mobile (padrão nativo), modal centrado no desktop.
 */
export default function SocialProofModal({
  onContinue,
}: SocialProofModalProps) {
  const [show, setShow] = useState(true);
  const [counter, setCounter] = useState(847);
  const [recentUnlocks, setRecentUnlocks] = useState(23);

  // Simula fluxo em tempo real — números sobem organicamente
  useEffect(() => {
    const counterInterval = setInterval(() => {
      setCounter((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 6000);
    const unlocksInterval = setInterval(() => {
      setRecentUnlocks((u) => u + Math.floor(Math.random() * 2) + 1);
    }, 15000);
    return () => {
      clearInterval(counterInterval);
      clearInterval(unlocksInterval);
    };
  }, []);

  const handleContinue = () => {
    setShow(false);
    setTimeout(onContinue, 280);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[199] flex items-end justify-center bg-black/90 backdrop-blur-md sm:items-center sm:p-4"
          onClick={handleContinue}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
          >
            {/* ── Header gradient ── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-violet-600 to-pink-600 px-5 py-4 text-center">
              {/* Pill "AO VIVO" */}
              <div className="mx-auto mb-2 flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                  Ao vivo
                </span>
              </div>

              <h2 className="text-lg font-bold text-white sm:text-xl">
                Vazamentos Mais Vistos
              </h2>
              <p className="mt-0.5 text-[13px] text-white/70">
                Conteúdos que estão bombando agora
              </p>
            </div>

            {/* ── Conteúdo scrollável ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Imagem de prova social */}
              <div className="bg-black/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/prova.png"
                  alt="Comentários e reações de usuários reais"
                  className="mx-auto w-full max-w-[340px] object-contain"
                />
              </div>

              {/* Stats + CTA */}
              <div className="px-5 pt-4 pb-5 sm:px-6">
                {/* Grid de stats — 3 colunas sempre, responsivo */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-zinc-800/80 py-3 text-center">
                    <p className="text-base font-bold text-violet-400 sm:text-lg">
                      {counter.toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-zinc-500 sm:text-[11px]">
                      Online agora
                    </p>
                  </div>
                  <div className="rounded-xl bg-zinc-800/80 py-3 text-center">
                    <p className="text-base font-bold text-emerald-400 sm:text-lg">
                      140K+
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-zinc-500 sm:text-[11px]">
                      Vídeos vazados
                    </p>
                  </div>
                  <div className="rounded-xl bg-zinc-800/80 py-3 text-center">
                    <p className="text-base font-bold text-amber-400 sm:text-lg">
                      3
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-zinc-500 sm:text-[11px]">
                      Créditos grátis
                    </p>
                  </div>
                </div>

                {/* Urgency bar — ping animation CORRIGIDA */}
                <div className="mb-5 rounded-xl border border-orange-500/20 bg-orange-500/[0.08] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                    </span>
                    <p className="text-[12px] leading-snug text-orange-300/90 sm:text-[13px]">
                      <span className="font-bold text-orange-300">
                        {recentUnlocks} pessoas
                      </span>{" "}
                      desbloquearam acesso nos últimos 10 min
                    </p>
                  </div>
                </div>

                {/* CTA principal */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleContinue}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-4 text-[15px] font-bold text-white shadow-lg shadow-violet-600/25 transition-shadow active:shadow-none"
                >
                  Usar Meus 3 Créditos Grátis
                </motion.button>

                <p className="mt-3 text-center text-[11px] text-zinc-600">
                  Válido apenas para novos acessos · Sem compromisso
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
