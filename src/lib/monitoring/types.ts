/**
 * Shared types for the monitoring system: the shape of a `monitoring_events`
 * row as seen from application code, plus the small set of enums that
 * constrain it. Every producer (client-side reporter, server instrumentation,
 * the ingestion API route) and consumer (admin dashboard queries) imports
 * from here so the `kind` discriminator and its per-kind fields stay in sync.
 */

/**
 * Discriminator for a monitoring event's row type. Note: the ingestion API
 * route (`src/app/api/monitoring/events/route.ts`) only accepts `"error"`
 * and `"web_vital"` from the client; `"timing"` and `"security"` events are
 * written directly by trusted server code via `src/lib/monitoring/server.ts`,
 * which is why `"security"` isn't listed here even though it's a valid
 * `kind` value in the table.
 */
export type MonitoringKind = "error" | "web_vital" | "timing";
/** Whether an event originated in the browser or on the server. */
export type MonitoringSource = "client" | "server";
/** Severity of a monitoring event, independent of its `kind`. */
export type MonitoringLevel = "error" | "warning" | "info";
/** Core Web Vitals metric names as reported by `useReportWebVitals`. */
export type WebVitalName = "LCP" | "CLS" | "INP" | "TTFB" | "FCP";
/** Per-sample rating bucket, matching the web-vitals.dev thresholds. */
export type WebVitalRating = "good" | "needs-improvement" | "poor";

/**
 * Superset payload shape covering every event kind. Fields are optional
 * because only a subset applies to any given `kind` (e.g. `metricName` /
 * `metricValue` for `"web_vital"`, `message` / `stack` for `"error"`).
 */
export type MonitoringEventPayload = {
  kind: MonitoringKind;
  source: MonitoringSource;
  level?: MonitoringLevel;
  path?: string;
  routeType?: string;
  statusCode?: number;
  message?: string;
  stack?: string;
  digest?: string;
  metricName?: WebVitalName;
  metricValue?: number;
  metricRating?: WebVitalRating;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

// Keep payloads small — sendBeacon has practical size limits and there's no
// reason to store megabyte-long stacks.
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_STACK_LENGTH = 4000;
