import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamVault — Conteúdo Exclusivo Premium",
  description:
    "Acesse conteúdo exclusivo e premium. Assine agora e desbloqueie o melhor da plataforma.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>▶</text></svg>" />
      </head>
      <body className="min-h-screen bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        {children}
      </body>
    </html>
  );
}
