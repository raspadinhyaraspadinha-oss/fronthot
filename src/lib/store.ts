/**
 * In-memory store for payment sessions.
 * In production, replace with Redis using REDIS_URL env var.
 */

interface PaymentSession {
  id: string;
  planId: string;
  status: "pending" | "paid" | "error";
  pixCode?: string;
  qrImage?: string;
  amount: number;
  createdAt: number;
  paidAt?: number;
  metadata?: Record<string, unknown>;
}

const sessions = new Map<string, PaymentSession>();

export function createSession(session: PaymentSession): void {
  sessions.set(session.id, session);
}

export function getSession(id: string): PaymentSession | undefined {
  return sessions.get(id);
}

export function updateSession(
  id: string,
  updates: Partial<PaymentSession>
): PaymentSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  const updated = { ...session, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}
