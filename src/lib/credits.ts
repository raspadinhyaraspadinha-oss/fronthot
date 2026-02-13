const CREDITS_KEY = "fronthot_credits";
const DEFAULT_CREDITS = 3;

export function getCredits(): number {
  if (typeof window === "undefined") return DEFAULT_CREDITS;
  try {
    const stored = localStorage.getItem(CREDITS_KEY);
    if (stored === null) {
      localStorage.setItem(CREDITS_KEY, String(DEFAULT_CREDITS));
      return DEFAULT_CREDITS;
    }
    return Math.max(0, parseInt(stored, 10));
  } catch {
    return DEFAULT_CREDITS;
  }
}

export function useCredit(): { remaining: number; success: boolean } {
  const current = getCredits();
  if (current <= 0) return { remaining: 0, success: false };
  const next = current - 1;
  localStorage.setItem(CREDITS_KEY, String(next));
  return { remaining: next, success: true };
}

export function resetCredits(): void {
  localStorage.setItem(CREDITS_KEY, String(DEFAULT_CREDITS));
}
