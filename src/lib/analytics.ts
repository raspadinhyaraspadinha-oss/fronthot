/**
 * Simple in-memory analytics for tracking conversion metrics
 * In production, replace with proper analytics (Plausible, Posthog, etc.)
 */

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

const events: AnalyticsEvent[] = [];
const MAX_EVENTS = 1000; // Keep last 1000 events in memory

export function trackEvent(event: string, data?: Record<string, unknown>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    timestamp: Date.now(),
    data,
  };

  events.push(analyticsEvent);

  // Keep memory bounded
  if (events.length > MAX_EVENTS) {
    events.shift();
  }

  // Log for Railway monitoring
  console.log(`[ANALYTICS] ${event}`, data ? JSON.stringify(data).slice(0, 100) : "");
}

export function getMetrics() {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const recentEvents = events.filter((e) => e.timestamp > hourAgo);
  const todayEvents = events.filter((e) => e.timestamp > dayAgo);

  const metrics = {
    total_events: events.length,
    last_hour: recentEvents.length,
    last_24h: todayEvents.length,
    by_event: {} as Record<string, number>,
    conversion_funnel: {
      page_views: todayEvents.filter((e) => e.event === "page_view").length,
      age_gate_passed: todayEvents.filter((e) => e.event === "age_gate_passed").length,
      social_proof_seen: todayEvents.filter((e) => e.event === "social_proof_seen").length,
      overlay_opened: todayEvents.filter((e) => e.event === "overlay_opened").length,
      plan_selected: todayEvents.filter((e) => e.event === "plan_selected").length,
      credit_used: todayEvents.filter((e) => e.event === "credit_used").length,
      pix_generated: todayEvents.filter((e) => e.event === "pix_generated").length,
      payment_completed: todayEvents.filter((e) => e.event === "payment_completed").length,
    },
  };

  // Count by event type
  todayEvents.forEach((e) => {
    metrics.by_event[e.event] = (metrics.by_event[e.event] || 0) + 1;
  });

  return metrics;
}

// Client-side tracking wrapper
export function trackClientEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  // Send to server
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, data }),
  }).catch(() => {
    // Silently fail if analytics endpoint not available
  });
}
