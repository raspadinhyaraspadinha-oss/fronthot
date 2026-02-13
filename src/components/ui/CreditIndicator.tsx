"use client";

import { motion } from "framer-motion";

interface CreditIndicatorProps {
  credits: number;
  max?: number;
}

export default function CreditIndicator({
  credits,
  max = 3,
}: CreditIndicatorProps) {
  return (
    <div className="flex items-center gap-2" aria-label={`${credits} de ${max} créditos disponíveis`}>
      {Array.from({ length: max }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-3 w-3 rounded-full ${
            i < credits
              ? "bg-[var(--color-accent)]"
              : "bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]"
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 20 }}
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        {credits}/{max}
      </span>
    </div>
  );
}
