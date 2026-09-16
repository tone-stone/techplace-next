import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_MESSAGE_LENGTH, MAX_STACK_LENGTH, type MonitoringEventPayload } from "./types";

/**
 * Server-only writers for the `monitoring_events` table. Each function
 * inserts straight through the service-role client instead of hitting our
 * own `/api/monitoring/events` endpoint — these only ever run in trusted
 * server contexts (instrumentation.ts, server actions), so the extra HTTP
 * hop back into the app would just add latency for no benefit. Every writer
 * swallows its own errors: logging failures must never take down the
 * request that triggered them.
 */

/**
 * Records a server-side error (typically called from
 * {@link import("@/instrumentation").onRequestError}).
 */
export async function logServerError(payload: MonitoringEventPayload) {
  try {
    const supabase = createAdminClient();
    await supabase.from("monitoring_events").insert({
      kind: payload.kind,
      source: payload.source,
      level: payload.level ?? "error",
      path: payload.path,
      route_type: payload.routeType,
      status_code: payload.statusCode,
      message: payload.message?.slice(0, MAX_MESSAGE_LENGTH),
      stack: payload.stack?.slice(0, MAX_STACK_LENGTH),
      digest: payload.digest,
      meta: payload.meta ?? {},
    });
  } catch {
    // Logging failures must never take down the request that triggered them.
  }
}

/**
 * Records a `"timing"` event for an operation that exceeded its threshold.
 * Called from `after()` (see src/lib/monitoring/timing.ts and src/proxy.ts),
 * so this always runs post-response — never adds latency to the request that
 * triggered it.
 */
export async function logSlowOperation(params: {
  label: string;
  durationMs: number;
  path?: string;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("monitoring_events").insert({
      kind: "timing",
      source: "server",
      message: params.label,
      duration_ms: params.durationMs,
      path: params.path,
    });
  } catch {
    // Logging failures must never take down the request that triggered them.
  }
}

/**
 * Records a `"security"` event (e.g. a failed login attempt). Called from
 * `after()` in login() (src/lib/auth/actions.ts) — never blocks the login
 * response, and never changes what the user sees either way.
 */
export async function logSecurityEvent(params: {
  message: string;
  path?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("monitoring_events").insert({
      kind: "security",
      source: "server",
      level: "warning",
      message: params.message,
      path: params.path,
      meta: params.meta ?? {},
    });
  } catch {
    // Logging failures must never take down the request that triggered them.
  }
}
