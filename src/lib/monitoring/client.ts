import type { MonitoringEventPayload } from "./types";

/**
 * Browser-side entry point into the monitoring system. Wraps the
 * fire-and-forget POST to `/api/monitoring/events` used by
 * `MonitoringClient`, `error.tsx`, and `global-error.tsx` to report
 * client-side errors and web vitals without blocking the UI.
 */

const ENDPOINT = "/api/monitoring/events";

/**
 * Fire-and-forget reporter for the browser: sendBeacon survives the page
 * unloading (tab close, navigation) — the same reason it's used for the
 * close-session ping — with a fetch(keepalive) fallback for browsers/contexts
 * where sendBeacon isn't available. Never throws — a monitoring failure must
 * never surface to the user.
 */
export function reportEvent(payload: MonitoringEventPayload) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true });
  } catch {
    // Reporting must never itself throw or surface to the user.
  }
}
