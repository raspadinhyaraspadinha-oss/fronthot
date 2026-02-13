"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  size?: "sm" | "md";
  color?: "accent" | "warning" | "danger";
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  size = "sm",
  color = "accent",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const height = size === "sm" ? "h-1.5" : "h-2.5";

  const barColor = {
    accent: "bg-[var(--color-accent)]",
    warning: "bg-[var(--color-warning)]",
    danger: "bg-[var(--color-danger)]",
  }[color];

  const barBg =
    "bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]";

  return (
    <div className="w-full">
      {label && (
        <span className="mb-1 block text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          {label}
        </span>
      )}
      <div
        className={`${height} w-full overflow-hidden rounded-[var(--radius-pill)] ${barBg}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progresso"}
      >
        <motion.div
          className={`${height} rounded-[var(--radius-pill)] ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
    </div>
  );
}
