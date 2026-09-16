import type { Instrumentation } from "next";

/**
 * Next.js instrumentation hook: wires the app-wide `onRequestError` handler
 * that feeds the monitoring system's server-side error reporting. This file
 * is auto-loaded by Next.js at startup (no explicit import needed elsewhere).
 */

/**
 * Catches errors from Server Components, Route Handlers, Server Actions and
 * Proxy automatically — no need to wrap every existing try/catch by hand.
 * Reports the error as a `"error"` monitoring event via
 * {@link import("@/lib/monitoring/server").logServerError}, imported
 * dynamically so this hot path doesn't pull in the Supabase admin client
 * until an error actually occurs.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { logServerError } = await import("@/lib/monitoring/server");

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  await logServerError({
    kind: "error",
    source: "server",
    level: "error",
    path: request.path,
    routeType: context.routeType,
    message,
    stack,
    digest,
  });
};
