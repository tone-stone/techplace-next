import { unstable_cache } from "next/cache";

/**
 * PageSpeed Insights (Lighthouse + CrUX field data) for the monitoring
 * dashboard. Calls Google's public PSI v5 `runPagespeed` endpoint for both
 * form factors and reduces the ~1 MB response down to the handful of scores
 * and metrics the dashboard shows.
 *
 * The raw call is slow (10-30 s) and rate-limited, so `getPageSpeedSummary`
 * wraps the *reduced* result in `unstable_cache` with a 6-hour revalidate —
 * only the small summary is persisted, never the full Lighthouse JSON, and
 * PSI is hit at most once per form factor per 6 h regardless of dashboard
 * traffic. No API key is required; set `PAGESPEED_API_KEY` to raise the
 * per-IP quota if the keyless limit (~1 req/s) ever bites.
 */

/** Which URL PSI analyses. Override per-env; defaults to the production site. */
const TARGET_URL = process.env.PAGESPEED_TARGET_URL ?? "https://techplacetj.com";

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** Lighthouse category scores shown as rings, each 0-100 (or null if PSI omitted it). */
export type LighthouseScores = {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
};

/** One Lighthouse lab metric (e.g. LCP): its formatted value and 0-1 pass score. */
export type LabMetric = {
  id: string;
  label: string;
  /** PSI's pre-formatted value, e.g. "1.2 s" or "0.01". */
  displayValue: string;
  /** Raw number in `numericUnit` (ms for times), for sorting/thresholds. */
  numericValue: number;
  /** 0-1 Lighthouse score for this metric, or null. */
  score: number | null;
};

/** One CrUX field metric (real-user p75 + FAST/AVERAGE/SLOW bucket). */
export type FieldMetric = {
  id: string;
  label: string;
  /** p75 across real users, in ms (or unitless ×100 for CLS — see `unit`). */
  percentile: number;
  unit: "ms" | "cls";
  category: "FAST" | "AVERAGE" | "SLOW" | null;
};

/** Everything the dashboard needs for one form factor. */
export type PageSpeedStrategyResult = {
  scores: LighthouseScores;
  lab: LabMetric[];
  /** CrUX field data — empty when the page/origin has too little traffic. */
  field: FieldMetric[];
  fieldOverall: "FAST" | "AVERAGE" | "SLOW" | null;
  lighthouseVersion: string | null;
};

/** Full summary: both form factors plus provenance for the dashboard footer. */
export type PageSpeedSummary = {
  url: string;
  fetchedAt: string;
  mobile: PageSpeedStrategyResult | { error: string };
  desktop: PageSpeedStrategyResult | { error: string };
};

type Strategy = "mobile" | "desktop";

/* PSI audit id -> short label, in display order. */
const LAB_METRICS: { id: string; label: string }[] = [
  { id: "first-contentful-paint", label: "First Contentful Paint" },
  { id: "largest-contentful-paint", label: "Largest Contentful Paint" },
  { id: "total-blocking-time", label: "Total Blocking Time" },
  { id: "cumulative-layout-shift", label: "Cumulative Layout Shift" },
  { id: "speed-index", label: "Speed Index" },
];

/* CrUX metric key -> label + unit, in display order. */
const FIELD_METRICS: { key: string; id: string; label: string; unit: "ms" | "cls" }[] = [
  { key: "LARGEST_CONTENTFUL_PAINT_MS", id: "LCP", label: "Largest Contentful Paint", unit: "ms" },
  { key: "INTERACTION_TO_NEXT_PAINT", id: "INP", label: "Interaction to Next Paint", unit: "ms" },
  { key: "CUMULATIVE_LAYOUT_SHIFT_SCORE", id: "CLS", label: "Cumulative Layout Shift", unit: "cls" },
  { key: "FIRST_CONTENTFUL_PAINT_MS", id: "FCP", label: "First Contentful Paint", unit: "ms" },
  { key: "EXPERIMENTAL_TIME_TO_FIRST_BYTE", id: "TTFB", label: "Time to First Byte", unit: "ms" },
];

function toScore(raw: unknown): number | null {
  return typeof raw === "number" ? Math.round(raw * 100) : null;
}

/** Reduces one raw PSI response to a `PageSpeedStrategyResult`. */
function reduce(json: Record<string, unknown>): PageSpeedStrategyResult {
  const lhr = (json.lighthouseResult ?? {}) as Record<string, unknown>;
  const categories = (lhr.categories ?? {}) as Record<string, { score?: number } | undefined>;
  const audits = (lhr.audits ?? {}) as Record<
    string,
    { displayValue?: string; numericValue?: number; score?: number } | undefined
  >;

  const lab: LabMetric[] = LAB_METRICS.map(({ id, label }) => {
    const a = audits[id];
    return {
      id,
      label,
      displayValue: a?.displayValue ?? "—",
      numericValue: typeof a?.numericValue === "number" ? a.numericValue : 0,
      score: typeof a?.score === "number" ? a.score : null,
    };
  });

  const loadingExp = (json.loadingExperience ?? {}) as {
    metrics?: Record<string, { percentile?: number; category?: string }>;
    overall_category?: string;
  };
  const fieldMetrics = loadingExp.metrics ?? {};
  const field: FieldMetric[] = FIELD_METRICS.flatMap(({ key, id, label, unit }) => {
    const m = fieldMetrics[key];
    if (!m || typeof m.percentile !== "number") return [];
    const cat = m.category;
    return [
      {
        id,
        label,
        percentile: m.percentile,
        unit,
        category: cat === "FAST" || cat === "AVERAGE" || cat === "SLOW" ? cat : null,
      },
    ];
  });

  const overall = loadingExp.overall_category;

  return {
    scores: {
      performance: toScore(categories.performance?.score),
      accessibility: toScore(categories.accessibility?.score),
      bestPractices: toScore(categories["best-practices"]?.score),
      seo: toScore(categories.seo?.score),
    },
    lab,
    field,
    fieldOverall:
      overall === "FAST" || overall === "AVERAGE" || overall === "SLOW" ? overall : null,
    lighthouseVersion: typeof lhr.lighthouseVersion === "string" ? lhr.lighthouseVersion : null,
  };
}

/** Runs one PSI analysis. Throws on network error / non-200 / timeout. */
async function runPageSpeed(strategy: Strategy): Promise<PageSpeedStrategyResult> {
  const params = new URLSearchParams({ url: TARGET_URL, strategy });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", c);
  }
  if (process.env.PAGESPEED_API_KEY) params.set("key", process.env.PAGESPEED_API_KEY);

  const res = await fetch(`${PSI_ENDPOINT}?${params}`, {
    // We persist the reduced summary via unstable_cache, not the megabyte of
    // Lighthouse JSON — so the fetch itself is always uncached.
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || json.error) {
    const apiMsg =
      json.error && typeof json.error === "object" && "message" in json.error
        ? String((json.error as { message: unknown }).message)
        : `HTTP ${res.status}`;
    throw new Error(`PSI ${strategy}: ${apiMsg}`);
  }
  return reduce(json);
}

async function buildSummary(): Promise<PageSpeedSummary> {
  const [mobile, desktop] = await Promise.allSettled([
    runPageSpeed("mobile"),
    runPageSpeed("desktop"),
  ]);

  const unwrap = (r: PromiseSettledResult<PageSpeedStrategyResult>) =>
    r.status === "fulfilled"
      ? r.value
      : { error: r.reason instanceof Error ? r.reason.message : "Error al consultar PageSpeed" };

  return {
    url: TARGET_URL,
    fetchedAt: new Date().toISOString(),
    mobile: unwrap(mobile),
    desktop: unwrap(desktop),
  };
}

/**
 * Cached PageSpeed summary for both form factors. Recomputed at most once
 * every 6 hours; every other call returns the persisted summary instantly.
 * Bust early with `revalidateTag("pagespeed")`.
 */
export const getPageSpeedSummary = unstable_cache(buildSummary, ["pagespeed-summary"], {
  revalidate: 21_600,
  tags: ["pagespeed"],
});
