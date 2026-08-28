"use server";

/**
 * Read-side queries for the admin monitoring dashboard
 * (`MonitoringSection.tsx`). Each function reads from the shared
 * `monitoring_events` table via the cookie-bound (RLS-respecting) Supabase
 * client, aggregates rows into a dashboard-friendly shape, and fails soft —
 * a query error returns an empty/zeroed result rather than throwing, so a
 * flaky read never breaks the admin page.
 */

import { createClient } from "@/lib/supabase/server";
import type { WebVitalName, WebVitalRating } from "./types";

/** A single `"error"` event as displayed in the recent-errors list. */
export type MonitoringErrorEvent = {
  id: string;
  createdAt: string;
  source: "client" | "server";
  level: string | null;
  path: string | null;
  routeType: string | null;
  message: string | null;
  stack: string | null;
  digest: string | null;
};

/** One day's error count, used to render the error trend chart. */
export type ErrorDailyCount = { date: string; count: number };

/** Aggregated error counts for the dashboard's error KPIs and trend chart. */
export type ErrorStats = {
  daily: ErrorDailyCount[];
  last24h: number;
  last7d: number;
};

/** p75 summary for one Web Vital metric over the queried window. */
export type WebVitalSummary = {
  name: WebVitalName;
  p75: number;
  rating: WebVitalRating;
  sampleSize: number;
};

/** A single `"timing"` event that crossed the slow-operation threshold. */
export type SlowOperation = {
  id: string;
  createdAt: string;
  label: string;
  durationMs: number;
  path: string | null;
};

/** A single failed-login `"security"` event, decoded from its `meta` JSON. */
export type FailedLoginAttempt = {
  id: string;
  createdAt: string;
  email: string | null;
  ip: string | null;
};

/** Aggregated failed-login counts plus the most recent attempts. */
export type FailedLoginStats = {
  last24h: number;
  last7d: number;
  recent: FailedLoginAttempt[];
};

/** A page path ranked by its TTFB p75, used for the slowest-pages list. */
export type SlowPage = {
  path: string;
  p75: number;
  sampleSize: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Standard web-vitals.dev thresholds — same "good / needs-improvement / poor"
// bands the Next.js useReportWebVitals `rating` field uses per-sample.
const THRESHOLDS: Record<WebVitalName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

/** Buckets a metric value into "good" / "needs-improvement" / "poor". */
function rateMetric(name: WebVitalName, value: number): WebVitalRating {
  const t = THRESHOLDS[name];
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

/** Maps a raw `monitoring_events` row (snake_case) to {@link MonitoringErrorEvent}. */
function mapErrorRow(row: {
  id: string;
  created_at: string;
  source: string;
  level: string | null;
  path: string | null;
  route_type: string | null;
  message: string | null;
  stack: string | null;
  digest: string | null;
}): MonitoringErrorEvent {
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source === "server" ? "server" : "client",
    level: row.level,
    path: row.path,
    routeType: row.route_type,
    message: row.message,
    stack: row.stack,
    digest: row.digest,
  };
}

/** Fetches the most recent `"error"` events, newest first. */
export async function getRecentErrors(limit = 50): Promise<MonitoringErrorEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monitoring_events")
    .select("id, created_at, source, level, path, route_type, message, stack, digest")
    .eq("kind", "error")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapErrorRow);
}

/** Builds the per-day error trend and 24h/7d counts over the last `days` days. */
export async function getErrorStats(days = 14): Promise<ErrorStats> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from("monitoring_events")
    .select("created_at")
    .eq("kind", "error")
    .gte("created_at", since);

  if (error || !data) return { daily: [], last24h: 0, last7d: 0 };

  const now = Date.now();
  const buckets = new Map<string, number>();
  let last24h = 0;
  let last7d = 0;

  for (const row of data) {
    const t = new Date(row.created_at).getTime();
    const dayKey = row.created_at.slice(0, 10);
    buckets.set(dayKey, (buckets.get(dayKey) ?? 0) + 1);
    if (now - t <= DAY_MS) last24h++;
    if (now - t <= 7 * DAY_MS) last7d++;
  }

  const daily: ErrorDailyCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    daily.push({ date: key, count: buckets.get(key) ?? 0 });
  }

  return { daily, last24h, last7d };
}

/**
 * Computes p75 per Web Vital metric across all pages over the last `days`
 * days, ordered LCP, INP, CLS, TTFB, FCP. Metrics with no samples are omitted.
 */
export async function getWebVitalsSummary(days = 7): Promise<WebVitalSummary[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from("monitoring_events")
    .select("metric_name, metric_value")
    .eq("kind", "web_vital")
    .gte("created_at", since)
    .not("metric_value", "is", null);

  if (error || !data) return [];

  const byMetric = new Map<WebVitalName, number[]>();
  for (const row of data) {
    const name = row.metric_name as WebVitalName | null;
    if (!name || row.metric_value == null) continue;
    const values = byMetric.get(name) ?? [];
    values.push(row.metric_value);
    byMetric.set(name, values);
  }

  const order: WebVitalName[] = ["LCP", "INP", "CLS", "TTFB", "FCP"];
  const results: WebVitalSummary[] = [];
  for (const name of order) {
    const values = byMetric.get(name);
    if (!values || values.length === 0) continue;
    values.sort((a, b) => a - b);
    const p75 = values[Math.floor(values.length * 0.75)] ?? values[values.length - 1];
    results.push({ name, p75, rating: rateMetric(name, p75), sampleSize: values.length });
  }

  return results;
}

/** Fetches the slowest recorded `"timing"` events, ordered by duration descending. */
export async function getSlowOperations(limit = 30): Promise<SlowOperation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monitoring_events")
    .select("id, created_at, message, duration_ms, path")
    .eq("kind", "timing")
    .order("duration_ms", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data
    .filter((row) => row.duration_ms != null)
    .map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      label: row.message ?? "operación sin nombre",
      durationMs: row.duration_ms as number,
      path: row.path,
    }));
}

/**
 * Ranks pages by TTFB p75 over the last `days` days, worst first, capped to
 * the top 10.
 */
export async function getSlowPagesByTtfb(days = 7): Promise<SlowPage[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from("monitoring_events")
    .select("path, metric_value")
    .eq("kind", "web_vital")
    .eq("metric_name", "TTFB")
    .gte("created_at", since)
    .not("metric_value", "is", null)
    .not("path", "is", null);

  if (error || !data) return [];

  const byPath = new Map<string, number[]>();
  for (const row of data) {
    if (!row.path || row.metric_value == null) continue;
    const values = byPath.get(row.path) ?? [];
    values.push(row.metric_value);
    byPath.set(row.path, values);
  }

  const pages: SlowPage[] = [];
  for (const [path, values] of byPath) {
    values.sort((a, b) => a - b);
    const p75 = values[Math.floor(values.length * 0.75)] ?? values[values.length - 1];
    pages.push({ path, p75, sampleSize: values.length });
  }

  return pages.sort((a, b) => b.p75 - a.p75).slice(0, 10);
}

/**
 * Fetches failed-login `"security"` events over the last `days` days:
 * 24h/7d counts plus up to `limit` of the most recent attempts, with
 * email/IP decoded from each event's `meta` JSON.
 */
export async function getFailedLogins(days = 7, limit = 30): Promise<FailedLoginStats> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data, error } = await supabase
    .from("monitoring_events")
    .select("id, created_at, meta")
    .eq("kind", "security")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error || !data) return { last24h: 0, last7d: 0, recent: [] };

  const now = Date.now();
  let last24h = 0;
  let last7d = 0;
  const recent: FailedLoginAttempt[] = [];

  for (const row of data) {
    const t = new Date(row.created_at).getTime();
    if (now - t <= DAY_MS) last24h++;
    if (now - t <= 7 * DAY_MS) last7d++;
    if (recent.length < limit) {
      const meta = (row.meta ?? {}) as { email?: string; ip?: string | null };
      recent.push({
        id: row.id,
        createdAt: row.created_at,
        email: meta.email ?? null,
        ip: meta.ip ?? null,
      });
    }
  }

  return { last24h, last7d, recent };
}
