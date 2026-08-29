import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_MESSAGE_LENGTH,
  MAX_STACK_LENGTH,
  type MonitoringEventPayload,
  type MonitoringKind,
  type MonitoringLevel,
  type MonitoringSource,
} from "@/lib/monitoring/types";

/**
 * Public ingestion endpoint for the monitoring system's browser-side
 * reporter (`reportEvent` in `src/lib/monitoring/client.ts`). Accepts the
 * client-originating kinds — `"error"`, `"web_vital"`, `"engagement"` and
 * `"interaction"`. `"timing"` and `"security"` events are written
 * server-side directly, never through this route.
 */

const KINDS: MonitoringKind[] = ["error", "web_vital", "engagement", "interaction"];

/** Cap the stored `meta` blob — these are tiny by design ({visitId, section, …}). */
const MAX_META_BYTES = 1024;

/** Accepts a plain object under the size cap; anything else becomes `{}`. */
function sanitizeMeta(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  try {
    if (JSON.stringify(meta).length > MAX_META_BYTES) return {};
  } catch {
    return {};
  }
  return meta as Record<string, unknown>;
}
const SOURCES: MonitoringSource[] = ["client", "server"];
const LEVELS: MonitoringLevel[] = ["error", "warning", "info"];

/**
 * Validates and inserts a client-reported monitoring event. Public,
 * unauthenticated — hit via sendBeacon from every page on the site, so it
 * must never throw on malformed input and must respond fast. Auth, when
 * present, is read from the request's own cookies (the same client used for
 * cookie-bound reads elsewhere) so a logged-in admin/redactor's user_id is
 * captured for free; anonymous public visitors insert the same way, just
 * without a user_id.
 *
 * @returns 400 on malformed/invalid input, 204 on success, or 202 if the
 * insert itself failed (e.g. the table doesn't exist yet) — the beacon
 * caller never inspects the response, so this deliberately avoids a 500.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const payload = body as Partial<MonitoringEventPayload>;
  if (!payload.kind || !KINDS.includes(payload.kind)) {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  if (!payload.source || !SOURCES.includes(payload.source)) {
    return NextResponse.json({ error: "invalid source" }, { status: 400 });
  }
  if (payload.level && !LEVELS.includes(payload.level)) {
    return NextResponse.json({ error: "invalid level" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("monitoring_events").insert({
    kind: payload.kind,
    source: payload.source,
    level: payload.level,
    path: typeof payload.path === "string" ? payload.path.slice(0, 500) : null,
    route_type: typeof payload.routeType === "string" ? payload.routeType.slice(0, 50) : null,
    status_code: typeof payload.statusCode === "number" ? payload.statusCode : null,
    message:
      typeof payload.message === "string" ? payload.message.slice(0, MAX_MESSAGE_LENGTH) : null,
    stack: typeof payload.stack === "string" ? payload.stack.slice(0, MAX_STACK_LENGTH) : null,
    digest: typeof payload.digest === "string" ? payload.digest.slice(0, 200) : null,
    metric_name: typeof payload.metricName === "string" ? payload.metricName : null,
    metric_value: typeof payload.metricValue === "number" ? payload.metricValue : null,
    metric_rating: typeof payload.metricRating === "string" ? payload.metricRating : null,
    user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    user_id: user?.id ?? null,
    meta: sanitizeMeta(payload.meta),
  });

  if (error) {
    // Table may not exist yet if the migration hasn't been run — don't 500
    // for the browser's fire-and-forget beacon.
    return NextResponse.json({ ok: false }, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
