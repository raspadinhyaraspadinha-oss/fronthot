const UTM_KEYS = [
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type UTMParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORAGE_KEY = "fronthot_utms";

export function captureUTMs(): UTMParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utms: UTMParams = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utms[key] = value;
  }

  // Only overwrite stored UTMs if we have new ones from URL
  if (Object.keys(utms).length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
  }

  return getStoredUTMs();
}

export function getStoredUTMs(): UTMParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getFBP(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
  return match ? match[1] : null;
}

export function buildFBC(fbclid: string | undefined): string | null {
  if (!fbclid) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}
