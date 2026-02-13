declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function initFacebookPixel(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;
  if (window.fbq) return; // already initialized

  const f = window;
  const b = document;
  const n = "script";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq: any = function (...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fbq as any).callMethod
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fbq as any).callMethod(...args)
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fbq as any).queue.push(args);
  };
  f.fbq = fbq;
  f._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  const script = b.createElement(n) as HTMLScriptElement;
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const firstScript = b.getElementsByTagName(n)[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);

  fbq("init", pixelId);
}

export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) {
    window.fbq("track", eventName, params || {}, { eventID: eventId });
  } else {
    window.fbq("track", eventName, params || {});
  }
}

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
