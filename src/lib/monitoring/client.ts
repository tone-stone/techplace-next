import type { MonitoringEventPayload } from "./types";

const ENDPOINT = "/api/monitoring/events";

// Fire-and-forget reporter for the browser: sendBeacon survives the page
// unloading (tab close, navigation) — the same reason it's used for the
// close-session ping — with a fetch(keepalive) fallback for browsers/contexts
// where sendBeacon isn't available.
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
