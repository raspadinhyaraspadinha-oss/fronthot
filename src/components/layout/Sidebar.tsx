"use client";

import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    label: "Home",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    ),
  },
  {
    label: "Shorts",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    ),
  },
  {
    label: "Assinaturas",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
  },
  {
    label: "Biblioteca",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
      />
    ),
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="fixed top-14 left-0 z-30 hidden h-[calc(100vh-3.5rem)] w-56 flex-col gap-1 border-r border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 pt-4 lg:flex">
        {navItems.map((item) => (
          <button
            key={item.label}
            className="flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)] transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              {item.icon}
            </svg>
            {item.label}
          </button>
        ))}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] shadow-[var(--shadow-xl)] lg:hidden"
              role="dialog"
              aria-label="Menu de navegação"
            >
              {/* Drawer header */}
              <div className="flex h-14 items-center gap-3 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] px-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]">
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </div>
                <span className="text-base font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  StreamVault
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex flex-col gap-1 px-3 pt-4">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={onClose}
                    className="flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:bg-[var(--color-surface2)] dark:hover:bg-[var(--color-surface2-dark)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      {item.icon}
                    </svg>
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
