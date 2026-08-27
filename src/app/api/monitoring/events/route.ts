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

const KINDS: MonitoringKind[] = ["error", "web_vital"];
const SOURCES: MonitoringSource[] = ["client", "server"];
const LEVELS: MonitoringLevel[] = ["error", "warning", "info"];

// Public, unauthenticated ingestion endpoint — hit via sendBeacon from every
// page on the site (see src/lib/monitoring/client.ts), so it must never throw
// on malformed input and must respond fast. Auth, when present, is read from
// the request's own cookies (the same client used for cookie-bound reads
// elsewhere) so a logged-in admin/redactor's user_id is captured for free;
// anonymous public visitors insert the same way, just without a user_id.
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
    meta: payload.meta && typeof payload.meta === "object" ? payload.meta : {},
  });

  if (error) {
    // Table may not exist yet if the migration hasn't been run — don't 500
    // for the browser's fire-and-forget beacon.
    return NextResponse.json({ ok: false }, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}
