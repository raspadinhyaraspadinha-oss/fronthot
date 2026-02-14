"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { plans, type Plan } from "@/data/plans";
import { previews, type Preview } from "@/data/previews";
import PlanCard from "@/components/ui/PlanCard";
import CreditIndicator from "@/components/ui/CreditIndicator";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";
import { showToast } from "@/components/ui/Toast";
import { getCredits, useCredit } from "@/lib/credits";
import { getStoredUTMs, getFBP, buildFBC } from "@/lib/utm";

type OverlayView = "plans" | "preview" | "checkout" | "upsell";

interface MainOverlayProps {
  open: boolean;
  onClose: () => void;
  onCreditsChanged: () => void;
}

/* ─── Circular countdown ring (reusable) ────────────────── */
function CountdownRing({ seconds, total, size = 44 }: { seconds: number; total: number; size?: number }) {
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / total) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={3} className="dark:stroke-[var(--color-border-dark)]" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-accent)" strokeWidth={3} strokeLinecap="round" strokeDasharray={circumference} animate={{ strokeDashoffset: circumference - progress }} transition={{ duration: 0.4, ease: "easeOut" }} />
      </svg>
      <span className="relative text-xs font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{seconds}s</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function MainOverlay({ open, onClose, onCreditsChanged }: MainOverlayProps) {
  const [view, setView] = useState<OverlayView>("plans");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [credits, setCredits] = useState(3);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Preview state
  const [activePreview, setActivePreview] = useState<Preview | null>(null);
  const [previewTimer, setPreviewTimer] = useState(40);
  const [previewTimerRunning, setPreviewTimerRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [usedPreviews, setUsedPreviews] = useState<Set<string>>(new Set());

  // Checkout state
  const [pixCode, setPixCode] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [pixTimer, setPixTimer] = useState(600); // 10 min
  const [pixTimerRunning, setPixTimerRunning] = useState(false);
  const pixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [copied, setCopied] = useState(false);
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);

  /* reset on open */
  useEffect(() => {
    if (open) {
      setCredits(getCredits());
      setView("plans");
      setCheckoutLoading(false);
      setCopied(false);
    }
  }, [open]);

  /* body scroll lock */
  useEffect(() => {
    if (open) document.body.classList.add("overlay-open");
    else document.body.classList.remove("overlay-open");
    return () => document.body.classList.remove("overlay-open");
  }, [open]);

  /* preview countdown */
  useEffect(() => {
    if (previewTimerRunning && previewTimer > 0) {
      previewTimerRef.current = setInterval(() => {
        setPreviewTimer((t) => {
          if (t <= 1) { setPreviewTimerRunning(false); videoRef.current?.pause(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (previewTimerRef.current) clearInterval(previewTimerRef.current); };
  }, [previewTimerRunning, previewTimer]);

  /* pix countdown */
  useEffect(() => {
    if (pixTimerRunning && pixTimer > 0) {
      pixTimerRef.current = setInterval(() => {
        setPixTimer((t) => { if (t <= 1) { setPixTimerRunning(false); return 0; } return t - 1; });
      }, 1000);
    }
    return () => { if (pixTimerRef.current) clearInterval(pixTimerRef.current); };
  }, [pixTimerRunning, pixTimer]);

  /* payment polling */
  useEffect(() => {
    if (view === "checkout" && sessionId && pixTimerRunning) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/check-payment?id=${sessionId}`);
          const data = await res.json();
          if (data.status === "paid") {
            setPixTimerRunning(false);
            setPaidPlanId(data.planId || selectedPlan);
            setView("upsell");
            showToast("Pagamento confirmado!", "success");
          }
        } catch { /* ignore */ }
      }, 5000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [view, sessionId, pixTimerRunning, selectedPlan]);

  /* pick random preview */
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
      const pv = pickPreview();
      setActivePreview(pv);
      setUsedPreviews((prev) => new Set(prev).add(pv.id));
      setPreviewTimer(40);
      setPreviewTimerRunning(true);
      setView("preview");
    } else {
      showToast("Sem créditos. Assine para continuar.", "error");
    }
  };

  /* autoplay video when preview enters DOM */
  const handleVideoRef = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el && view === "preview") {
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  }, [view]);

  const handleGoToCheckout = async () => {
    if (!selectedPlan) { showToast("Selecione um plano.", "info"); return; }
    const plan = plans.find((p) => p.id === selectedPlan)!;
    setCheckoutLoading(true);

    try {
      const utms = getStoredUTMs();
      const fbp = getFBP();
      const fbc = buildFBC(utms.fbclid);

      // Simple bot check token (proves JS execution)
      const botToken = btoa(`${Date.now()}-${Math.random()}-${navigator.userAgent.slice(0, 20)}`);

      const res = await fetch("/api/create-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-check": botToken,
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          utms,
          fbc,
          fbp,
        }),
      });
      const data = await res.json();
      setPixCode(data.pixCode || data.pixCode || "");
      setQrImage(data.qrImage || "");
      setSessionId(data.sessionId || "");
      setPixTimer(600);
      setPixTimerRunning(true);
      setCopied(false);
      setView("checkout");
    } catch {
      showToast("Erro ao gerar o Pix. Tente novamente.", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      showToast("Código Pix copiado!", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast("Não foi possível copiar. Selecione manualmente.", "info");
    }
  };

  const handleManualCheck = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/check-payment?id=${sessionId}`);
      const data = await res.json();
      if (data.status === "paid") {
        setPixTimerRunning(false);
        setPaidPlanId(data.planId || selectedPlan);
        setView("upsell");
        showToast("Pagamento confirmado!", "success");
      } else {
        showToast("Pagamento ainda não identificado. Aguarde alguns instantes.", "info");
      }
    } catch {
      showToast("Erro na verificação. Tente novamente.", "error");
    }
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    handleGoToCheckoutDirect(planId);
  };

  const handleGoToCheckoutDirect = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId)!;
    setCheckoutLoading(true);
    try {
      const utms = getStoredUTMs();
      const fbp = getFBP();
      const fbc = buildFBC(utms.fbclid);

      // Simple bot check token (proves JS execution)
      const botToken = btoa(`${Date.now()}-${Math.random()}-${navigator.userAgent.slice(0, 20)}`);

      const res = await fetch("/api/create-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-check": botToken,
        },
        body: JSON.stringify({ planId: plan.id, planName: plan.name, amount: plan.price, utms, fbc, fbp }),
      });
      const data = await res.json();
      setPixCode(data.pixCode || "");
      setQrImage(data.qrImage || "");
      setSessionId(data.sessionId || "");
      setPixTimer(600);
      setPixTimerRunning(true);
      setCopied(false);
      setSelectedPlan(planId);
      setView("checkout");
    } catch {
      showToast("Erro ao gerar o Pix. Tente novamente.", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  /* ─── animation variants ───────────────────────────────── */
  const slideVariants = {
    enterRight: { x: "50%", opacity: 0 },
    enterLeft: { x: "-50%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exitLeft: { x: "-50%", opacity: 0 },
    exitRight: { x: "50%", opacity: 0 },
  };
  const slideTx = { type: "spring" as const, stiffness: 320, damping: 32 };

  const selectedPlanObj = plans.find((p) => p.id === selectedPlan);
  const pixMinutes = Math.floor(pixTimer / 60);
  const pixSeconds = pixTimer % 60;

  /* plan hierarchy for upsell: prata < ouro < black */
  const planRank: Record<string, number> = { prata: 0, ouro: 1, black: 2 };
  const paidRank = paidPlanId ? planRank[paidPlanId] ?? -1 : -1;
  const upgradePlans = plans.filter((p) => (planRank[p.id] ?? 0) > paidRank);

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
          aria-label="StreamVault"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.05 }}
            className="glass relative my-2 w-full max-w-2xl overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] sm:my-4"
          >
            <AnimatePresence mode="wait" initial={false}>

              {/* ═══ VIEW: PLANS ══════════════════════════════════ */}
              {view === "plans" && (
                <motion.div key="plans" variants={slideVariants} initial="enterLeft" animate="center" exit="exitLeft" transition={slideTx}>
                  <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-5 pt-7 pb-0 sm:max-h-[calc(100vh-3rem)] sm:px-8 sm:pt-8">
                    <div className="mb-5 text-center sm:mb-6">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }} className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-light)] dark:bg-[rgba(108,60,224,0.2)] sm:mb-4 sm:h-14 sm:w-14">
                        <svg className="h-6 w-6 text-[var(--color-accent)] sm:h-7 sm:w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
                      </motion.div>
                      <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:text-3xl">Bem-vindo(a) ao Vazados Proibidos</h1>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-2">Conteúdos vazados e hackeados, videos que você só vai encontrar aqui. Escolha seu plano ou desbloqueie uma preview gratuitamente.</p>
                      <p className="mt-1.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-2">
                        <span className="font-semibold text-[var(--color-success)]">+2.847</span> usuários ativos{" · "}<span className="font-semibold text-[var(--color-accent)]">133</span> entraram hoje
                      </p>
                    </div>

                    {/* Credits */}
                    <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface2)]/50 dark:bg-[var(--color-surface2-dark)]/50 p-3.5 sm:mb-6 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">Seus créditos de preview</h2>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Assista 40s de um conteúdo vazado exclusivo.</p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Você com certeza nunca viu nada igual a isso.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <CreditIndicator credits={credits} />
                          <Button size="sm" variant="primary" onClick={handleUseCredit} disabled={credits <= 0}>
                            {credits > 0 ? "Usar 1 crédito" : "Sem créditos"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Plans */}
                    <div className="mb-5 sm:mb-6">
                      <h2 className="mb-1 text-base font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">Planos disponíveis</h2>
                      <p className="mb-3 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mb-4">Vagas quase completas — garanta a sua agora.</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} selected={selectedPlan === plan.id} onSelect={setSelectedPlan} />)}</div>
                    </div>

                    <div className="mb-5 rounded-[var(--radius-md)] bg-[var(--color-accent-light)]/60 dark:bg-[rgba(108,60,224,0.1)] px-4 py-2 text-center text-xs font-medium text-[var(--color-accent)] sm:mb-6 sm:py-2.5">Vagas quase completas — cancelamento a qualquer momento.</div>
                  </div>

                  {/* Sticky footer */}
                  <div className="sticky bottom-0 rounded-b-[var(--radius-xl)] border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-5">
                    <Button variant="primary" size="lg" fullWidth loading={checkoutLoading} onClick={handleGoToCheckout}>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.66 10.51l-3.08-3.08a.996.996 0 00-1.41 0l-.59.59-2.83-2.83a.996.996 0 00-1.41 0L5.26 8.27a.996.996 0 000 1.41l2.83 2.83-.59.59a.996.996 0 000 1.41l3.08 3.08a.996.996 0 001.41 0l.59-.59 2.83 2.83a.996.996 0 001.41 0l3.08-3.08a.996.996 0 000-1.41l-2.83-2.83.59-.59a.996.996 0 000-1.41z"/></svg>
                      Assinar com Pix{selectedPlanObj ? ` — ${selectedPlanObj.priceDisplay}` : ""}
                    </Button>
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-3 sm:gap-3 sm:text-xs">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        Pagamento seguro
                      </span>
                      <span>·</span><span>Sem spam</span><span>·</span><span>Cancele a qualquer momento</span>
                    </div>
                    <div className="mt-3 flex justify-center sm:mt-4">
                      <button onClick={() => { onClose(); showToast("Simulação: login de acesso existente.", "info"); }} className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:underline">Já tenho acesso</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ VIEW: PREVIEW ═══════════════════════════════ */}
              {view === "preview" && activePreview && (
                <motion.div key="preview" variants={slideVariants} initial="enterRight" animate="center" exit="exitRight" transition={slideTx} className="flex flex-col">
                  <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto sm:max-h-[calc(100vh-3rem)]">
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <video ref={handleVideoRef} key={activePreview.id} src={activePreview.src} className="h-full w-full object-contain" playsInline muted preload="auto" onEnded={() => { setPreviewTimerRunning(false); setPreviewTimer(0); }} />
                      <AnimatePresence>
                        {previewTimer === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-center px-4">
                              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                                <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
                              </div>
                              <p className="text-base font-semibold text-white sm:text-lg">Preview encerrada</p>
                              <p className="mt-1 text-sm text-white/60">Assine para acesso completo e ilimitado</p>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Top bar */}
                      <div className="absolute top-0 right-0 left-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-3 py-2.5 sm:px-4 sm:py-3">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setPreviewTimerRunning(false); videoRef.current?.pause(); setView("plans"); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 sm:h-10 sm:w-10" aria-label="Voltar">
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </motion.button>
                        {previewTimer > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="rounded-[var(--radius-pill)] bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">Preview</span>
                            <CountdownRing seconds={previewTimer} total={40} />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="px-5 pt-5 pb-0 sm:px-8 sm:pt-6">
                      <div className="mb-2 flex items-center gap-2">{activePreview.tags.map((tag) => <span key={tag} className="rounded-[var(--radius-pill)] bg-[var(--color-accent-light)] dark:bg-[rgba(108,60,224,0.15)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent)] sm:text-xs">{tag}</span>)}<span className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">{activePreview.views}</span></div>
                      <h2 className="text-base font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:text-lg">{activePreview.title}</h2>
                      <p className="mt-1 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">{activePreview.author}</p>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">{activePreview.description}</p>
                      <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface2)]/60 dark:bg-[var(--color-surface2-dark)]/60 px-3.5 py-2.5">
                        <div className="flex -space-x-1.5">{["from-violet-400 to-purple-600","from-pink-400 to-rose-500","from-amber-400 to-orange-500"].map((g,i) => <div key={i} className={`h-6 w-6 rounded-full border-2 border-[var(--color-surface)] dark:border-[var(--color-surface-dark)] bg-gradient-to-br ${g}`}/>)}</div>
                        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]"><span className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">+847 pessoas</span> já desbloquearam o acesso completo</p>
                      </div>
                      <div className="h-4 sm:h-6" />
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="sticky bottom-0 shrink-0 border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <Button variant="primary" size="lg" fullWidth onClick={() => { setPreviewTimerRunning(false); videoRef.current?.pause(); setView("plans"); }}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Desbloquear acesso completo
                      </Button>
                      <Button variant="outline" size="lg" fullWidth onClick={() => { setPreviewTimerRunning(false); videoRef.current?.pause(); handleUseCredit(); }} disabled={credits <= 0}>
                        {credits > 0 ? (<>Outra preview ({credits} crédito{credits !== 1 ? "s" : ""})</>) : "Sem créditos restantes"}
                      </Button>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:mt-3 sm:gap-3 sm:text-xs">
                      <span className="flex items-center gap-1"><svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Pagamento seguro</span>
                      <span>·</span><span>Cancele a qualquer momento</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ VIEW: CHECKOUT (PIX) ════════════════════════ */}
              {view === "checkout" && (
                <motion.div key="checkout" variants={slideVariants} initial="enterRight" animate="center" exit="exitLeft" transition={slideTx}>
                  <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-5 pt-7 pb-0 sm:max-h-[calc(100vh-3rem)] sm:px-8 sm:pt-8">
                    {/* Back */}
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setPixTimerRunning(false); setView("plans"); }} className="mb-4 flex items-center gap-1.5 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)] transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                      Voltar aos planos
                    </motion.button>

                    {/* Header */}
                    <div className="mb-5 text-center sm:mb-6">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success)]/15">
                        <svg className="h-6 w-6 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.66 10.51l-3.08-3.08a.996.996 0 00-1.41 0l-.59.59-2.83-2.83a.996.996 0 00-1.41 0L5.26 8.27a.996.996 0 000 1.41l2.83 2.83-.59.59a.996.996 0 000 1.41l3.08 3.08a.996.996 0 001.41 0l.59-.59 2.83 2.83a.996.996 0 001.41 0l3.08-3.08a.996.996 0 000-1.41l-2.83-2.83.59-.59a.996.996 0 000-1.41z"/></svg>
                      </motion.div>
                      <h1 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:text-2xl">Pague com Pix</h1>
                      <p className="mt-1 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                        Plano <span className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{selectedPlanObj?.name}</span> — <span className="font-bold text-[var(--color-accent)]">{selectedPlanObj?.priceDisplay}</span>
                      </p>
                    </div>

                    {/* Timer urgency */}
                    <div className="mb-5 flex items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/8 px-4 py-3">
                      <CountdownRing seconds={pixTimer} total={600} size={48} />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                          {pixTimer > 0 ? `${String(pixMinutes).padStart(2, "0")}:${String(pixSeconds).padStart(2, "0")}` : "Expirado"}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">{pixTimer > 0 ? "para pagar e garantir sua vaga" : "Gere um novo código"}</p>
                      </div>
                    </div>

                    {/* QR Code */}
                    {pixCode && (
                      <div className="mb-5 flex justify-center">
                        <div className="rounded-[var(--radius-lg)] bg-white p-3 shadow-md">
                          <QRCodeSVG
                            value={pixCode}
                            size={window.innerWidth < 640 ? 176 : 208}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>
                    )}

                    {/* Pix code copy */}
                    <div className="mb-5">
                      <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Código Pix copia e cola</label>
                      <div className="flex gap-2">
                        <div className="min-w-0 flex-1 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface2)] dark:bg-[var(--color-surface2-dark)] px-3 py-2.5">
                          <p className="truncate text-xs text-[var(--color-text)] dark:text-[var(--color-text-dark)] font-mono select-all">{pixCode || "Carregando..."}</p>
                        </div>
                        <Button variant={copied ? "primary" : "outline"} size="md" onClick={handleCopyPix}>
                          {copied ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                          )}
                          {copied ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                    </div>

                    {/* Social proof + urgency */}
                    <div className="mb-5 space-y-3">
                      <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface2)]/60 dark:bg-[var(--color-surface2-dark)]/60 px-3.5 py-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-success)]/15"><svg className="h-4 w-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>
                        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]"><span className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">23 pessoas</span> pagaram nos últimos 30 minutos</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface2)]/60 dark:bg-[var(--color-surface2-dark)]/60 px-3.5 py-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-danger)]/15"><svg className="h-4 w-4 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Restam <span className="font-semibold text-[var(--color-danger)]">{selectedPlanObj ? selectedPlanObj.slotsTotal - selectedPlanObj.slotsFilled : 4} vagas</span> para este plano hoje</p>
                      </div>
                    </div>

                    <div className="h-4 sm:h-6" />
                  </div>

                  {/* Sticky footer */}
                  <div className="sticky bottom-0 rounded-b-[var(--radius-xl)] border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-5">
                    <Button variant="primary" size="lg" fullWidth onClick={handleManualCheck}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Já paguei — verificar pagamento
                    </Button>
                    <p className="mt-2.5 text-center text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] sm:text-xs">Verificação automática a cada 5 segundos · Pagamento instantâneo</p>
                  </div>
                </motion.div>
              )}

              {/* ═══ VIEW: UPSELL ════════════════════════════════ */}
              {view === "upsell" && (
                <motion.div key="upsell" variants={slideVariants} initial="enterRight" animate="center" exit="exitRight" transition={slideTx}>
                  <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-5 pt-7 pb-0 sm:max-h-[calc(100vh-3rem)] sm:px-8 sm:pt-8">
                    {/* Success header */}
                    <div className="mb-6 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/15">
                        <svg className="h-8 w-8 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </motion.div>
                      <h1 className="text-xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:text-2xl">Pagamento confirmado!</h1>
                      <p className="mt-1 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                        Plano <span className="font-semibold">{plans.find(p => p.id === paidPlanId)?.name}</span> ativado com sucesso.
                      </p>
                    </div>

                    {upgradePlans.length > 0 ? (
                      <>
                        {/* Urgency: slots full */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-5 rounded-[var(--radius-lg)] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-4 sm:px-5">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger)]/15">
                              <svg className="h-4 w-4 text-[var(--color-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">Vagas esgotadas nos planos anteriores</p>
                              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                                {paidPlanId === "prata"
                                  ? "O plano Prata atingiu o limite de vagas para hoje. Para liberar o acesso completo agora, é necessário um upgrade para o Ouro ou Black."
                                  : "Os planos Prata e Ouro atingiram o limite de vagas para hoje. Para acesso imediato, faça o upgrade para o Black."}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        {/* Filled plans visualization */}
                        <div className="mb-5 space-y-2.5">
                          {plans.filter(p => (planRank[p.id] ?? 0) <= paidRank).map((plan) => (
                            <div key={plan.id} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface2)]/60 dark:bg-[var(--color-surface2-dark)]/60 px-4 py-3 opacity-60">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{plan.name}</span>
                                  <span className="rounded-[var(--radius-pill)] bg-[var(--color-danger)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--color-danger)]">ESGOTADO</span>
                                </div>
                                <ProgressBar value={100} max={100} color="danger" size="sm" />
                              </div>
                              <span className="text-xs text-[var(--color-muted)]">{plan.slotsTotal}/{plan.slotsTotal}</span>
                            </div>
                          ))}
                        </div>

                        {/* Upgrade cards */}
                        <div className="mb-5">
                          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">Faça upgrade e libere agora</h2>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {upgradePlans.map((plan) => (
                              <motion.button key={plan.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleUpgrade(plan.id)} className="flex flex-col rounded-[var(--radius-xl)] border-2 border-[var(--color-accent)] bg-[var(--color-accent-light)]/30 dark:bg-[rgba(108,60,224,0.08)] p-4 text-left transition-colors hover:bg-[var(--color-accent-light)]/60 dark:hover:bg-[rgba(108,60,224,0.15)]">
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{plan.name}</span>
                                  <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-2.5 py-0.5 text-xs font-bold text-white">{plan.slotsFilled < plan.slotsTotal ? `${plan.slotsTotal - plan.slotsFilled} vagas` : "Última vaga!"}</span>
                                </div>
                                <span className="mt-1 text-lg font-extrabold text-[var(--color-accent)]">{plan.priceDisplay}<span className="text-xs font-normal text-[var(--color-muted)]"> / {plan.period}</span></span>
                                <ul className="mt-2 space-y-1">{plan.features.map((f,i) => <li key={i} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]"><svg className="h-3 w-3 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>{f}</li>)}</ul>
                                <div className="mt-3 flex h-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent)] text-sm font-semibold text-white">
                                  Upgrade com Pix — {plan.priceDisplay}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-5 text-center text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                          <span className="font-semibold text-[var(--color-success)]">15 pessoas</span> fizeram upgrade nos últimos 60 minutos
                        </div>
                      </>
                    ) : (
                      /* Black plan — full success */
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-5 py-5 text-center">
                        <p className="text-base font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">Acesso Black desbloqueado!</p>
                        <p className="mt-1 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">Conteúdo completo e ilimitado. Aproveite.</p>
                      </motion.div>
                    )}

                    <div className="h-4 sm:h-6" />
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 rounded-b-[var(--radius-xl)] border-t border-[var(--color-border)]/50 dark:border-[var(--color-border-dark)]/50 bg-[var(--color-surface)]/90 dark:bg-[var(--color-surface-dark)]/90 backdrop-blur-xl px-5 py-4 sm:px-8 sm:py-5">
                    {upgradePlans.length > 0 ? (
                      <p className="text-center text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
                        Selecione um plano acima para fazer upgrade instantâneo
                      </p>
                    ) : (
                      <Button variant="primary" size="lg" fullWidth onClick={onClose}>
                        Acessar conteúdo
                      </Button>
                    )}
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
