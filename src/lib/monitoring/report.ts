"use server";

/**
 * Consolidated monitoring report for a date window, with period-over-period
 * comparison. Reads `monitoring_events` once per event family for
 * `[previousSince, until)` and splits each row into the current window
 * (`>= since`) or the previous one of equal length, so every headline number
 * comes with a delta vs the prior period.
 *
 * Kept separate from `queries.ts` (which powers the live dashboard cards) so
 * the report's arbitrary-window reads don't perturb those.
 */

import { createClient } from "@/lib/supabase/server";
import { getPageSpeedSummary, type PageSpeedSummary } from "./pagespeed";
import type { WebVitalName, WebVitalRating } from "./types";

const WV_ORDER: WebVitalName[] = ["LCP", "INP", "CLS", "TTFB", "FCP"];
const WV_THRESHOLDS: Record<WebVitalName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};
const SCROLL_MARKS = [50, 75, 100] as const;

function rate(name: WebVitalName, v: number): WebVitalRating {
  const t = WV_THRESHOLDS[name];
  return v <= t.good ? "good" : v <= t.poor ? "needs-improvement" : "poor";
}
function p75(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.75)] ?? s[s.length - 1];
}
const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

/** One headline number with its previous-period counterpart. */
export type ReportMetric = {
  value: number | null;
  prev: number | null;
  /** `value - prev`, or null when either side is missing. */
  delta: number | null;
  /** true = a higher value is an improvement (visits, scroll, success rate). */
  betterWhenUp: boolean;
};

function mk(value: number | null, prev: number | null, betterWhenUp: boolean): ReportMetric {
  const delta = value != null && prev != null ? value - prev : null;
  return { value, prev, delta, betterWhenUp };
}

export type ReportWebVital = {
  name: WebVitalName;
  p75: number | null;
  prevP75: number | null;
  rating: WebVitalRating | null;
  samples: number;
};

export type MonitoringReport = {
  range: { since: string; until: string };
  previousRange: { since: string; until: string };
  generatedAt: string;
  siteUrl: string;
  performance: {
    /** Point-in-time PSI snapshot (not windowed) — no delta. */
    pagespeed: PageSpeedSummary;
    webVitals: ReportWebVital[];
  };
  stability: {
    errors: ReportMetric;
    slowOps: ReportMetric;
  };
  audience: {
    visits: ReportMetric;
    scroll: { depth: number; metric: ReportMetric }[];
    topCtas: { track: string; count: number; prev: number }[];
    /** Session count by device class (mobile / tablet / desktop). */
    devices: { key: string; count: number; prev: number }[];
    /** Session count by referrer source, most common first. */
    referrers: { key: string; count: number; prev: number }[];
    /** Share of sessions from a returning visitor. */
    returning: ReportMetric;
    /** Clicks to other origins by host, most clicked first. */
    topOutbound: { host: string; count: number; prev: number }[];
  };
  contact: {
    start: ReportMetric;
    submit: ReportMetric;
    success: ReportMetric;
    submitRate: ReportMetric;
    successRate: ReportMetric;
  };
};

type Row = {
  created_at: string;
  metric_name?: string | null;
  metric_value?: number | null;
  meta?: unknown;
};

const metaOf = (r: Row): Record<string, unknown> =>
  r.meta && typeof r.meta === "object" ? (r.meta as Record<string, unknown>) : {};

/**
 * @param since  ISO start of the reporting window (inclusive).
 * @param until  ISO end of the reporting window (exclusive).
 */
export async function getMonitoringReport({
  since,
  until,
}: {
  since: string;
  until: string;
}): Promise<MonitoringReport> {
  const supabase = await createClient();

  const sinceMs = Date.parse(since);
  const untilMs = Date.parse(until);
  const span = Math.max(1, untilMs - sinceMs);
  const prevSince = new Date(sinceMs - span).toISOString();
  const inCurrent = (r: Row) => Date.parse(r.created_at) >= sinceMs;

  const win = (cols: string) =>
    supabase
      .from("monitoring_events")
      .select(cols)
      .gte("created_at", prevSince)
      .lt("created_at", until);

  const [errRes, wvRes, timingRes, engRes, intRes, pagespeed] = await Promise.all([
    win("created_at").eq("kind", "error"),
    win("created_at, metric_name, metric_value")
      .eq("kind", "web_vital")
      .not("metric_value", "is", null),
    win("created_at").eq("kind", "timing"),
    win("created_at, metric_name, metric_value, meta").eq("kind", "engagement"),
    win("created_at, metric_name, meta").eq("kind", "interaction"),
    getPageSpeedSummary().catch(
      (): PageSpeedSummary => ({
        url: process.env.PAGESPEED_TARGET_URL ?? "https://techplacetj.com",
        fetchedAt: new Date().toISOString(),
        mobile: { error: "PageSpeed no disponible" },
        desktop: { error: "PageSpeed no disponible" },
      }),
    ),
  ]);

  const rows = (r: { data: unknown }) => (Array.isArray(r.data) ? (r.data as Row[]) : []);
  const errRows = rows(errRes);
  const wvRows = rows(wvRes);
  const timingRows = rows(timingRes);
  const engRows = rows(engRes);
  const intRows = rows(intRes);

  const splitCount = (rows: Row[], betterWhenUp: boolean) =>
    mk(rows.filter(inCurrent).length, rows.filter((r) => !inCurrent(r)).length, betterWhenUp);

  // --- Stability ---
  const errors = splitCount(errRows, false);
  const slowOps = splitCount(timingRows, false);

  // --- Web Vitals p75 (current vs previous) ---
  const wvBuckets = new Map<WebVitalName, { cur: number[]; prev: number[] }>();
  for (const r of wvRows) {
    const name = r.metric_name as WebVitalName | null;
    if (!name || r.metric_value == null || !WV_ORDER.includes(name)) continue;
    const b = wvBuckets.get(name) ?? { cur: [], prev: [] };
    (inCurrent(r) ? b.cur : b.prev).push(r.metric_value);
    wvBuckets.set(name, b);
  }
  const webVitals: ReportWebVital[] = WV_ORDER.flatMap((name) => {
    const b = wvBuckets.get(name);
    if (!b || b.cur.length === 0) return [];
    const cur = p75(b.cur)!;
    return [{ name, p75: cur, prevP75: p75(b.prev), rating: rate(name, cur), samples: b.cur.length }];
  });

  // --- Audience: distinct visits + scroll depth + session breakdown ---
  const visitsCur = new Set<string>();
  const visitsPrev = new Set<string>();
  const scrollCur = new Map<number, Set<string>>(SCROLL_MARKS.map((m) => [m, new Set<string>()]));
  const scrollPrev = new Map<number, Set<string>>(SCROLL_MARKS.map((m) => [m, new Set<string>()]));
  const deviceCur = new Map<string, number>();
  const devicePrev = new Map<string, number>();
  const refCur = new Map<string, number>();
  const refPrev = new Map<string, number>();
  const returning = [0, 0]; // [current, previous]
  const sessions = [0, 0];
  const bump = (m: Map<string, number>, k: unknown) => {
    if (typeof k === "string" && k) m.set(k, (m.get(k) ?? 0) + 1);
  };
  for (const r of engRows) {
    const meta = metaOf(r);
    const cur = inCurrent(r);
    if (r.metric_name === "session") {
      const i = cur ? 0 : 1;
      sessions[i]++;
      if (meta.visitor === "returning") returning[i]++;
      bump(cur ? deviceCur : devicePrev, meta.device);
      bump(cur ? refCur : refPrev, meta.referrer);
      continue;
    }
    const visitId = typeof meta.visitId === "string" ? meta.visitId : null;
    if (!visitId) continue;
    (cur ? visitsCur : visitsPrev).add(visitId);
    if (r.metric_name === "scroll_depth" && r.metric_value != null) {
      for (const m of SCROLL_MARKS) {
        if (r.metric_value >= m) (cur ? scrollCur : scrollPrev).get(m)!.add(visitId);
      }
    }
  }
  const mergeKeys = (a: Map<string, number>, b: Map<string, number>) =>
    [...new Set([...a.keys(), ...b.keys()])]
      .map((key) => ({ key, count: a.get(key) ?? 0, prev: b.get(key) ?? 0 }))
      .sort((x, y) => y.count - x.count);
  const devices = mergeKeys(deviceCur, devicePrev);
  const referrers = mergeKeys(refCur, refPrev).slice(0, 6);
  const visits = mk(visitsCur.size, visitsPrev.size, true);
  const scroll = SCROLL_MARKS.map((depth) => ({
    depth,
    metric: mk(
      visitsCur.size ? pct(scrollCur.get(depth)!.size, visitsCur.size) : null,
      visitsPrev.size ? pct(scrollPrev.get(depth)!.size, visitsPrev.size) : null,
      true,
    ),
  }));

  // --- CTAs + outbound + contact funnel ---
  const ctaCur = new Map<string, number>();
  const ctaPrev = new Map<string, number>();
  const outCur = new Map<string, number>();
  const outPrev = new Map<string, number>();
  const funnel = { start: [0, 0], submit: [0, 0], success: [0, 0] } as const;
  const fn = funnel as unknown as Record<"start" | "submit" | "success", number[]>;
  for (const r of intRows) {
    const meta = metaOf(r);
    const cur = inCurrent(r);
    if (r.metric_name === "click") {
      const track = typeof meta.track === "string" ? meta.track : null;
      if (track) {
        const m = cur ? ctaCur : ctaPrev;
        m.set(track, (m.get(track) ?? 0) + 1);
      }
    } else if (r.metric_name === "outbound") {
      const host = typeof meta.host === "string" ? meta.host : null;
      if (host) {
        const m = cur ? outCur : outPrev;
        m.set(host, (m.get(host) ?? 0) + 1);
      }
    } else if (r.metric_name === "form" && meta.form === "contacto") {
      const step = meta.step;
      const i = cur ? 0 : 1;
      if (step === "start" || step === "submit" || step === "success") fn[step][i]++;
    }
  }
  const topFrom = (a: Map<string, number>, b: Map<string, number>, key: string) =>
    [...a.entries()]
      .map(([k, count]) => ({ [key]: k, count, prev: b.get(k) ?? 0 }))
      .sort((x, y) => y.count - x.count)
      .slice(0, 8);
  const topCtas = topFrom(ctaCur, ctaPrev, "track") as { track: string; count: number; prev: number }[];
  const topOutbound = topFrom(outCur, outPrev, "host") as { host: string; count: number; prev: number }[];

  const rateMetric = (num: number[], den: number[]) =>
    mk(den[0] > 0 ? pct(num[0], den[0]) : null, den[1] > 0 ? pct(num[1], den[1]) : null, true);

  return {
    range: { since, until },
    previousRange: { since: prevSince, until: since },
    generatedAt: new Date().toISOString(),
    siteUrl: pagespeed.url,
    performance: { pagespeed, webVitals },
    stability: { errors, slowOps },
    audience: {
      visits,
      scroll,
      topCtas,
      devices,
      referrers,
      returning: mk(
        sessions[0] ? pct(returning[0], sessions[0]) : null,
        sessions[1] ? pct(returning[1], sessions[1]) : null,
        true,
      ),
      topOutbound,
    },
    contact: {
      start: mk(fn.start[0], fn.start[1], true),
      submit: mk(fn.submit[0], fn.submit[1], true),
      success: mk(fn.success[0], fn.success[1], true),
      submitRate: rateMetric(fn.submit, fn.start),
      successRate: rateMetric(fn.success, fn.submit),
    },
  };
}
