"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SocialProofModalProps {
  onContinue: () => void;
}

export default function SocialProofModal({ onContinue }: SocialProofModalProps) {
  const [show, setShow] = useState(true);
  const [counter, setCounter] = useState(847);

  // Simula pessoas entrando em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    setShow(false);
    setTimeout(onContinue, 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[199] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          onClick={handleContinue}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative w-full max-w-lg overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 20 }}
                className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
              >
                <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </motion.div>
              <h2 className="text-xl font-bold text-white">🔥 Vazamentos Mais Vistos</h2>
              <p className="mt-1 text-sm text-white/80">Conteúdos que estão bombando AGORA</p>
            </div>

            {/* Social proof image */}
            <div className="relative bg-black">
              <Image
                src="/prova.png"
                alt="Prova Social"
                width={400}
                height={700}
                className="mx-auto w-full max-w-[280px] object-contain"
                priority
              />
            </div>

            {/* Stats bar */}
            <div className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-accent)]">{counter.toLocaleString()}</p>
                  <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Pessoas online agora</p>
                </div>
                <div className="h-10 w-px bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-success)]">140K+</p>
                  <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Vídeos vazados</p>
                </div>
                <div className="h-10 w-px bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-warning)]">3</p>
                  <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Créditos grátis</p>
                </div>
              </div>

              {/* Urgency bar */}
              <div className="mb-4 rounded-[var(--radius-md)] border border-orange-500/30 bg-orange-500/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-2 w-2 items-center justify-center">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-orange-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
                  </div>
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                    <span className="font-bold">23 pessoas</span> acabaram de desbloquear acesso nos últimos 10 minutos
                  </p>
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                className="w-full rounded-[var(--radius-lg)] bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-shadow hover:shadow-xl"
              >
                🎁 Usar Meus 3 Créditos Grátis
              </motion.button>

              <p className="mt-3 text-center text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                Válido apenas para novos acessos • Sem compromisso
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
