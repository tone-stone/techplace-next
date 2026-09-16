"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { reportEvent } from "@/lib/monitoring/client";
import type { WebVitalName, WebVitalRating } from "@/lib/monitoring/types";

/**
 * Client-side monitoring collector. Mounted once in the root layout so it
 * covers the whole site (landing, blog, admin). Renders nothing — it only
 * wires up passive listeners: `useReportWebVitals` for Core Web Vitals, and
 * `window` `error`/`unhandledrejection` listeners for uncaught client
 * errors that don't hit a React error boundary. All events are forwarded via
 * `reportEvent` (sendBeacon-based, non-blocking).
 */
export default function MonitoringClient() {
  useReportWebVitals((metric) => {
    reportEvent({
      kind: "web_vital",
      source: "client",
      path: window.location.pathname,
      metricName: metric.name as WebVitalName,
      metricValue: metric.value,
      metricRating: metric.rating as WebVitalRating,
    });
  });

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportEvent({
        kind: "error",
        source: "client",
        level: "error",
        path: window.location.pathname,
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportEvent({
        kind: "error",
        source: "client",
        level: "error",
        path: window.location.pathname,
        message:
          reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection"),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
