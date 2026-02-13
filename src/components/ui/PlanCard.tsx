"use client";

import { motion } from "framer-motion";
import type { Plan } from "@/data/plans";
import ProgressBar from "./ProgressBar";

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: (planId: string) => void;
}

export default function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const pct = (plan.slotsFilled / plan.slotsTotal) * 100;
  const isAlmostFull = pct >= 90;

  return (
    <motion.button
      onClick={() => onSelect(plan.id)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      animate={
        selected
          ? {
              boxShadow: "0 0 0 2px var(--color-accent), 0 8px 24px rgba(108,60,224,0.18)",
              y: -4,
            }
          : {
              boxShadow: "var(--shadow-md)",
              y: 0,
            }
      }
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`relative flex w-full cursor-pointer flex-col rounded-[var(--radius-xl)] border p-5 text-left transition-colors ${
        selected
          ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] dark:bg-[rgba(108,60,224,0.12)]"
          : "border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]"
      }`}
      aria-pressed={selected}
      aria-label={`Plano ${plan.name} - ${plan.priceDisplay} por ${plan.period}`}
    >
      {/* Badge */}
      {plan.badge && (
        <span className="absolute -top-2.5 right-4 rounded-[var(--radius-pill)] bg-[var(--color-warning)] px-3 py-0.5 text-xs font-bold text-white">
          {plan.badge}
        </span>
      )}

      {/* Popular indicator */}
      {plan.popular && (
        <span className="mb-3 inline-block w-fit rounded-[var(--radius-pill)] bg-[var(--color-accent)] px-3 py-0.5 text-xs font-semibold text-white">
          Mais popular
        </span>
      )}

      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
          {plan.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
            {plan.priceDisplay}
          </span>
          <span className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
            / {plan.period}
          </span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-4 flex flex-col gap-2">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]"
          >
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {/* Slots progress */}
      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span
            className={`font-medium ${isAlmostFull ? "text-[var(--color-danger)]" : "text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]"}`}
          >
            {plan.slotsFilled}/{plan.slotsTotal} vagas preenchidas
          </span>
        </div>
        <ProgressBar
          value={plan.slotsFilled}
          max={plan.slotsTotal}
          color={pct >= 95 ? "danger" : pct >= 90 ? "warning" : "accent"}
        />
      </div>

      {/* Selected check */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
