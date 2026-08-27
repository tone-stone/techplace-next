export type MonitoringKind = "error" | "web_vital" | "timing";
export type MonitoringSource = "client" | "server";
export type MonitoringLevel = "error" | "warning" | "info";
export type WebVitalName = "LCP" | "CLS" | "INP" | "TTFB" | "FCP";
export type WebVitalRating = "good" | "needs-improvement" | "poor";

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
