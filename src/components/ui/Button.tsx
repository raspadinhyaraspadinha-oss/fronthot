"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.97]",
      secondary:
        "bg-[var(--color-surface2)] dark:bg-[var(--color-surface2-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] active:scale-[0.97]",
      ghost:
        "bg-transparent text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)] active:scale-[0.97]",
      outline:
        "bg-transparent border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)] active:scale-[0.97]",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm rounded-[var(--radius-md)]",
      md: "h-11 px-5 text-sm rounded-[var(--radius-lg)]",
      lg: "h-13 px-8 text-base rounded-[var(--radius-xl)]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
        className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="31.4"
              strokeDashoffset="10"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
