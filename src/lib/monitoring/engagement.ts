import { reportEvent } from "./client";
import type { EngagementMetricName, InteractionMetricName } from "./types";

/**
 * Browser-side helpers for behaviour analytics (`EngagementTracker` and the
 * contact form). Thin wrappers over `reportEvent` that stamp every event
 * with an anonymous per-tab visit id.
 *
 * The visit id lives in `sessionStorage`: it groups events from one browsing
 * session (survives in-page navigation and reloads) and is wiped when the
 * tab closes. It is a random value with no link to any identity and is never
 * set as a cookie, so this stays outside consent-banner territory — until we
 * add persistent (cross-session) identification, which this deliberately is not.
 */

const VISIT_KEY = "tp_visit_id";

/** Stable random id for the current tab session; `"anon"` if storage is unavailable. */
export function getVisitId(): string {
  try {
    let id = sessionStorage.getItem(VISIT_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(VISIT_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Reports a passive engagement signal (section dwell time, scroll depth). */
export function trackEngagement(
  name: EngagementMetricName,
  value: number,
  meta: Record<string, unknown> = {}
) {
  reportEvent({
    kind: "engagement",
    source: "client",
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    metricName: name,
    metricValue: value,
    meta: { visitId: getVisitId(), ...meta },
  });
}

/** Reports an active interaction (tagged click, contact-form funnel step). */
export function trackInteraction(
  name: InteractionMetricName,
  meta: Record<string, unknown> = {}
) {
  reportEvent({
    kind: "interaction",
    source: "client",
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    metricName: name,
    meta: { visitId: getVisitId(), ...meta },
  });
}
