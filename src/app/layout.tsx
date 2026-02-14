import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vazados Proibidos — Conteúdos Exclusivos e Hackeados",
  description:
    "Vídeos vazados e hackeados que você só encontra aqui. Acesso ilimitado a +140.000 conteúdos exclusivos e proibidos. Assine agora!",
  keywords: "vazados, conteúdo exclusivo, vídeos proibidos, acesso premium, conteúdo hackeado",
  openGraph: {
    title: "Vazados Proibidos — Acesso Exclusivo",
    description: "Conteúdos vazados que você nunca viu. +140.000 vídeos exclusivos.",
    type: "website",
    locale: "pt_BR",
  },
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
