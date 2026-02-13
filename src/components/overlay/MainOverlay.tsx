"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { plans } from "@/data/plans";
import { previews, type Preview } from "@/data/previews";
import PlanCard from "@/components/ui/PlanCard";
import CreditIndicator from "@/components/ui/CreditIndicator";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { getCredits, useCredit } from "@/lib/credits";

type OverlayView = "plans" | "preview";

interface MainOverlayProps {
  open: boolean;
  onClose: () => void;
  onCreditsChanged: () => void;
}

/* ─── Circular countdown ring ────────────────────────────── */
function CountdownRing({
  seconds,
  total,
}: {
  seconds: number;
  total: number;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / total) * circumference;

  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <svg className="absolute -rotate-90" width={44} height={44}>
        <circle
          cx={22}
          cy={22}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={3}
          className="dark:stroke-[var(--color-border-dark)]"
        />
        <motion.circle
          cx={22}
          cy={22}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </svg>
      <span className="relative text-xs font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        {seconds}s
      </span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function MainOverlay({
  open,
  onClose,
  onCreditsChanged,
}: MainOverlayProps) {
  const [view, setView] = useState<OverlayView>("plans");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState(3);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Preview state
  const [activePreview, setActivePreview] = useState<Preview | null>(null);
  const [timer, setTimer] = useState(40);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showPlansInPreview, setShowPlansInPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track which previews have been used
  const [usedPreviews, setUsedPreviews] = useState<Set<string>>(new Set());

  /* sync credits whenever overlay opens */
  useEffect(() => {
    if (open) {
      setCredits(getCredits());
      setView("plans");
      setShowPlansInPreview(false);
    }
  }, [open]);

  /* body scroll lock */
  useEffect(() => {
    if (open) {
      document.body.classList.add("overlay-open");
    } else {
      document.body.classList.remove("overlay-open");
    }
    return () => document.body.classList.remove("overlay-open");
  }, [open]);

  /* countdown timer */
  useEffect(() => {
    if (timerRunning && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setTimerRunning(false);
            if (videoRef.current) videoRef.current.pause();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timer]);

  /* pick a random unused preview, fallback to random if all used */
  const pickPreview = useCallback((): Preview => {
    const available = previews.filter((p) => !usedPreviews.has(p.id));
    const pool = available.length > 0 ? available : previews;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [usedPreviews]);

  /* ─── handlers ──────────────────────────────────────────── */
  const handleUseCredit = () => {
    const result = useCredit();
    if (result.success) {
      setCredits(result.remaining);
      onCreditsChanged();

      const preview = pickPreview();
      setActivePreview(preview);
      setUsedPreviews((prev) => new Set(prev).add(preview.id));
      setTimer(40);
      setTimerRunning(true);
      setShowPlansInPreview(false);
      setView("preview");

      // auto-play after transition
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      }, 400);
    } else {
      showToast("Sem créditos disponíveis. Assine para continuar.", "error");
    }
  };

  const handleBackToPlans = () => {
    setTimerRunning(false);
    if (videoRef.current) videoRef.current.pause();
    setView("plans");
  };

  const handleUseAnotherCredit = () => {
    setTimerRunning(false);
    if (videoRef.current) videoRef.current.pause();
    handleUseCredit();
  };

  const handleCheckout = (method: string) => {
    if (!selectedPlan) {
      showToast("Selecione um plano para continuar.", "info");
      return;
    }
    setCheckoutLoading(method);
    setTimeout(() => {
      setCheckoutLoading(null);
      const plan = plans.find((p) => p.id === selectedPlan);
      showToast(
        `Simulação: checkout ${method} para plano ${plan?.name || ""} (${plan?.priceDisplay}). Integração real em breve.`,
        "success"
      );
    }, 1800);
  };

  /* ─── shared slide variants ─────────────────────────────── */
  const slideVariants = {
    enterFromRight: { x: "60%", opacity: 0 },
    enterFromLeft: { x: "-60%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitToLeft: { x: "-60%", opacity: 0 },
    exitToRight: { x: "60%", opacity: 0 },
  };

  const slideTransition = {
    type: "spring" as const,
    stiffness: 320,
    damping: 32,
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-md p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Acesso restrito"
        >
          {/* Outer card shell — fixed size, contents swap inside */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 28,
              delay: 0.05,
            }}
            className="glass relative my-2 w-full max-w-2xl overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] sm:my-4"
          >
            <AnimatePresence mode="wait" initial={false}>
              {/* ═══════════════════════════════════════════════ */}
              {/* VIEW: PLANS                                     */}
              {/* ═══════════════════════════════════════════════ */}
              {view === "plans" && (
                <motion.div
                  key="plans"
                  variants={slideVariants}
                  initial="enterFromLeft"
                  animate="center"
                  exit="exitToLeft"
                  transition={slideTransition}
                >
                  {/* Scroll container */}
                  <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-5 pt-7 pb-0 sm:max-h-[calc(100vh-3rem)] sm:px-8 sm:pt-8">
                    {/* Header */}
                    <div className="mb-5 text-center sm:mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                          delay: 0.2,
                        }}
                        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-light)] dark:bg-[rgba(108,60,224,0.2)] sm:mb-4 sm:h-14 sm:w-14"
                      >
                        <svg
                          className="h-6 w-6 text-[var(--color-accent)] sm:h-7 sm:w-7"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      </motion.div>
                      <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:text-3xl">
                        Bem-vindo(a) ao StreamVault
                      </h1>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-2">
                        Conteúdo exclusivo e premium. Escolha seu plano ou
                        desbloqueie uma preview.
                      </p>
                      <p className="mt-1.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-2">
                        <span className="font-semibold text-[var(--color-success)]">
                          +2.847
                        </span>{" "}
                        usuários ativos{" · "}
                        <span className="font-semibold text-[var(--color-accent)]">
                          12
                        </span>{" "}
                        entraram hoje
                      </p>
                    </div>

                    {/* Credits section */}
                    <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface2)]/50 dark:bg-[var(--color-surface2-dark)]/50 p-3.5 sm:mb-6 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                            Seus créditos de preview
                          </h2>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                            Assista 40s de um conteúdo exclusivo.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <CreditIndicator credits={credits} />
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={handleUseCredit}
                            disabled={credits <= 0}
                          >
                            {credits > 0 ? "Usar 1 crédito" : "Sem créditos"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Plans */}
                    <div className="mb-5 sm:mb-6">
                      <h2 className="mb-1 text-base font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                        Planos disponíveis
                      </h2>
                      <p className="mb-3 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mb-4">
                        Vagas quase completas — garanta a sua agora.
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {plans.map((plan) => (
                          <PlanCard
                            key={plan.id}
                            plan={plan}
                            selected={selectedPlan === plan.id}
                            onSelect={setSelectedPlan}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Urgency */}
                    <div className="mb-5 rounded-[var(--radius-md)] bg-[var(--color-accent-light)]/60 dark:bg-[rgba(108,60,224,0.1)] px-4 py-2 text-center text-xs font-medium text-[var(--color-accent)] sm:mb-6 sm:py-2.5">
                      Vagas quase completas — cancelamento a qualquer momento.
                    </div>
                  </div>

                  {/* Sticky footer */}
                  <div className="sticky bottom-0 rounded-b-[var(--radius-xl)] border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={checkoutLoading === "pix"}
                        onClick={() => handleCheckout("pix")}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M17.66 10.51l-3.08-3.08a.996.996 0 00-1.41 0l-.59.59-2.83-2.83a.996.996 0 00-1.41 0L5.26 8.27a.996.996 0 000 1.41l2.83 2.83-.59.59a.996.996 0 000 1.41l3.08 3.08a.996.996 0 001.41 0l.59-.59 2.83 2.83a.996.996 0 001.41 0l3.08-3.08a.996.996 0 000-1.41l-2.83-2.83.59-.59a.996.996 0 000-1.41z" />
                        </svg>
                        Assinar com Pix
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        loading={checkoutLoading === "card"}
                        onClick={() => handleCheckout("cartão")}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Cartão de crédito
                      </Button>
                    </div>
                    {/* Microcopy */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-3 sm:gap-3 sm:text-xs">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Pagamento seguro
                      </span>
                      <span>·</span>
                      <span>Sem spam</span>
                      <span>·</span>
                      <span>Cancele a qualquer momento</span>
                    </div>
                    {/* Secondary link */}
                    <div className="mt-3 flex justify-center sm:mt-4">
                      <button
                        onClick={() => {
                          onClose();
                          showToast(
                            "Simulação: login de acesso existente.",
                            "info"
                          );
                        }}
                        className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:underline"
                      >
                        Já tenho acesso
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════ */}
              {/* VIEW: PREVIEW PLAYER                            */}
              {/* ═══════════════════════════════════════════════ */}
              {view === "preview" && activePreview && (
                <motion.div
                  key="preview"
                  variants={slideVariants}
                  initial="enterFromRight"
                  animate="center"
                  exit="exitToRight"
                  transition={slideTransition}
                  className="flex flex-col"
                >
                  <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-h-[calc(100vh-3rem)]">
                    {/* Video player area */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        src={activePreview.src}
                        className="h-full w-full object-contain"
                        playsInline
                        muted
                        preload="auto"
                        onEnded={() => {
                          setTimerRunning(false);
                          setTimer(0);
                        }}
                      />

                      {/* Timer expired overlay */}
                      <AnimatePresence>
                        {timer === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                              }}
                              className="text-center px-4"
                            >
                              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                                <svg
                                  className="h-7 w-7 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                                </svg>
                              </div>
                              <p className="text-base font-semibold text-white sm:text-lg">
                                Preview encerrada
                              </p>
                              <p className="mt-1 text-sm text-white/60">
                                Assine para acesso completo e ilimitado
                              </p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Top bar: back + timer */}
                      <div className="absolute top-0 right-0 left-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-3 py-2.5 sm:px-4 sm:py-3">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={handleBackToPlans}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25 sm:h-10 sm:w-10"
                          aria-label="Voltar aos planos"
                        >
                          <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </motion.button>

                        {/* Countdown ring */}
                        {timer > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="rounded-[var(--radius-pill)] bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                              Preview
                            </span>
                            <CountdownRing seconds={timer} total={40} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content below video */}
                    <div className="px-5 pt-5 pb-0 sm:px-8 sm:pt-6">
                      {/* Tags */}
                      <div className="mb-2 flex items-center gap-2">
                        {activePreview.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-[var(--radius-pill)] bg-[var(--color-accent-light)] dark:bg-[rgba(108,60,224,0.15)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)] sm:text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                          {activePreview.views}
                        </span>
                      </div>

                      {/* Title + description */}
                      <h2 className="text-base font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:text-lg">
                        {activePreview.title}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                        {activePreview.author}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                        {activePreview.description}
                      </p>

                      {/* Social proof inline */}
                      <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface2)]/60 dark:bg-[var(--color-surface2-dark)]/60 px-3.5 py-2.5">
                        <div className="flex -space-x-1.5">
                          {[
                            "from-violet-400 to-purple-600",
                            "from-pink-400 to-rose-500",
                            "from-amber-400 to-orange-500",
                          ].map((g, i) => (
                            <div
                              key={i}
                              className={`h-6 w-6 rounded-full border-2 border-[var(--color-surface)] dark:border-[var(--color-surface-dark)] bg-gradient-to-br ${g}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                          <span className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                            +847 pessoas
                          </span>{" "}
                          já desbloquearam o acesso completo
                        </p>
                      </div>

                      {/* Inline expand plans */}
                      <AnimatePresence>
                        {showPlansInPreview && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                            className="overflow-hidden"
                          >
                            <div className="mt-5 sm:mt-6">
                              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                                Escolha seu plano
                              </h3>
                              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                                {plans.map((plan) => (
                                  <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    selected={selectedPlan === plan.id}
                                    onSelect={setSelectedPlan}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Spacer before sticky footer */}
                      <div className="h-4 sm:h-6" />
                    </div>
                  </div>

                  {/* Sticky footer — ALWAYS visible on preview */}
                  <div className="sticky bottom-0 shrink-0 border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      {/* Primary CTA: unlock / plan */}
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={() => {
                          if (!showPlansInPreview) {
                            setShowPlansInPreview(true);
                          } else {
                            handleCheckout("pix");
                          }
                        }}
                        loading={checkoutLoading === "pix"}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        {showPlansInPreview
                          ? "Assinar com Pix"
                          : "Desbloquear acesso completo"}
                      </Button>

                      {/* Secondary: use another credit OR back */}
                      <Button
                        variant="outline"
                        size="lg"
                        fullWidth
                        onClick={handleUseAnotherCredit}
                        disabled={credits <= 0}
                      >
                        {credits > 0 ? (
                          <>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Outra preview ({credits} crédito
                            {credits !== 1 ? "s" : ""})
                          </>
                        ) : (
                          "Sem créditos restantes"
                        )}
                      </Button>
                    </div>

                    {/* Microcopy */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-3 sm:gap-3 sm:text-xs">
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Pagamento seguro
                      </span>
                      <span>·</span>
                      <span>Cancele a qualquer momento</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
