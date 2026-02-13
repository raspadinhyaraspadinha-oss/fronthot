"use client";

import { motion } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)]/80 dark:bg-[var(--color-surface-dark)]/80 backdrop-blur-xl px-4">
      {/* Menu hamburger */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)] transition-colors"
        aria-label="Abrir menu lateral"
      >
        <svg className="h-5 w-5 text-[var(--color-text)] dark:text-[var(--color-text-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]">
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        </div>
        <span className="hidden text-base font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] sm:block">
          StreamVault
        </span>
      </div>

      {/* Search */}
      <div className="mx-4 flex max-w-md flex-1">
        <div className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface2)] dark:bg-[var(--color-surface2-dark)] px-4">
          <svg className="h-4 w-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar"
            className="w-full bg-transparent text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder:text-[var(--color-muted)] outline-none"
            aria-label="Buscar conteúdo"
            readOnly
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)] transition-colors"
          aria-label="Notificações"
        >
          <svg className="h-5 w-5 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </motion.button>

        {/* Profile */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)]"
          aria-label="Perfil"
        >
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </motion.button>
      </div>
    </header>
  );
}
