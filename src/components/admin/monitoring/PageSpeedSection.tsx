"use client";

/**
 * Admin dashboard card for Google PageSpeed Insights. Fetches the cached
 * summary from `/api/monitoring/pagespeed` on mount (the route caches the
 * upstream PSI call for 6 h, so this is cheap on repeat views) and renders
 * the Lighthouse category scores, lab metrics, and CrUX field data for the
 * selected form factor. Client-fetched rather than server-rendered with the
 * rest of `MonitoringSection` so a slow/cold PSI call never blocks `/admin`.
 */

import { useEffect, useState } from "react";
import { ExternalLink, Gauge, Loader2, Monitor, Smartphone } from "lucide-react";
import type {
  FieldMetric,
  LabMetric,
  LighthouseScores,
  PageSpeedStrategyResult,
  PageSpeedSummary,
} from "@/lib/monitoring/pagespeed";

type Strategy = "mobile" | "desktop";

/** Coarse relative-time string, in Spanish (mirrors MonitoringSection's helper). */
function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

function bandColor(score: number | null): string {
  if (score === null) return "text-gray-500 border-white/10";
  if (score >= 90) return "text-emerald-400 border-emerald-400/30";
  if (score >= 50) return "text-amber-400 border-amber-400/30";
  return "text-red-400 border-red-400/30";
}

function metricColor(score: number | null): string {
  if (score === null) return "bg-white/20";
  if (score >= 0.9) return "bg-emerald-500";
  if (score >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

const FIELD_STYLE: Record<"FAST" | "AVERAGE" | "SLOW", { text: string; label: string }> = {
  FAST: { text: "text-emerald-400", label: "Rápido" },
  AVERAGE: { text: "text-amber-400", label: "Medio" },
  SLOW: { text: "text-red-400", label: "Lento" },
};

const SCORE_LABELS: { key: keyof LighthouseScores; label: string }[] = [
  { key: "performance", label: "Rendimiento" },
  { key: "accessibility", label: "Accesibilidad" },
  { key: "bestPractices", label: "Prácticas" },
  { key: "seo", label: "SEO" },
];

function formatFieldValue(m: FieldMetric): string {
  if (m.unit === "cls") return (m.percentile / 100).toFixed(2);
  return `${Math.round(m.percentile)} ms`;
}

/* ------------------------------------------------------------------ */

function ScoreRings({ scores }: { scores: LighthouseScores }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {SCORE_LABELS.map(({ key, label }) => {
        const score = scores[key];
        return (
          <div
            key={key}
            className={`flex flex-col items-center gap-1 rounded-xl border bg-white/[0.02] p-3 ${bandColor(
              score
            )}`}
          >
            <span className="text-2xl font-bold tabular-nums">{score ?? "—"}</span>
            <span className="text-[11px] font-medium text-gray-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LabMetrics({ lab }: { lab: LabMetric[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Métricas de laboratorio
      </p>
      {lab.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate text-xs text-gray-300" title={m.label}>
            {m.label}
          </span>
          <span className="h-2 w-16 shrink-0 overflow-hidden rounded-full bg-white/5">
            <span
              className={`block h-full rounded-full ${metricColor(m.score)}`}
              style={{ width: `${m.score === null ? 0 : Math.round(m.score * 100)}%` }}
            />
          </span>
          <span className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-gray-200">
            {m.displayValue}
          </span>
        </div>
      ))}
    </div>
  );
}

function FieldMetrics({
  field,
  overall,
}: {
  field: FieldMetric[];
  overall: PageSpeedStrategyResult["fieldOverall"];
}) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Datos de campo · usuarios reales
        {overall && (
          <span className={`font-bold ${FIELD_STYLE[overall].text}`}>
            {FIELD_STYLE[overall].label}
          </span>
        )}
      </p>
      {field.length === 0 ? (
        <p className="text-xs text-gray-500">
          Todavía no hay suficiente tráfico real para datos de campo (CrUX).
        </p>
      ) : (
        field.map((m) => (
          <div key={m.id} className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 text-xs">
              <span className="font-semibold text-gray-200" title={m.label}>
                {m.id}
              </span>
              <span className="ml-1.5 text-gray-500">{m.label}</span>
            </p>
            <span
              className={`shrink-0 text-xs font-bold tabular-nums ${
                m.category ? FIELD_STYLE[m.category].text : "text-gray-300"
              }`}
            >
              {formatFieldValue(m)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function StrategyView({ result }: { result: PageSpeedStrategyResult | { error: string } }) {
  if ("error" in result) {
    return <p className="text-sm text-gray-500">No se pudo obtener el análisis: {result.error}</p>;
  }
  return (
    <div className="space-y-5">
      <ScoreRings scores={result.scores} />
      <LabMetrics lab={result.lab} />
      <FieldMetrics field={result.field} overall={result.fieldOverall} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Top-level PageSpeed Insights card for the monitoring dashboard. */
export default function PageSpeedSection() {
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const [summary, setSummary] = useState<PageSpeedSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/monitoring/pagespeed");
        const json = (await res.json()) as PageSpeedSummary | { error: string };
        if (cancelled) return;
        if ("error" in json) setError(json.error);
        else setSummary(json);
      } catch {
        if (!cancelled) setError("No se pudo contactar con el servidor.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reportUrl = summary
    ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(summary.url)}&form_factor=${strategy}`
    : "https://pagespeed.web.dev/";

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-3">
        <Gauge className="h-4 w-4 text-sky-300" />
        <h2 className="text-lg font-bold text-white">PageSpeed Insights</h2>

        <div className="ml-auto flex rounded-lg border border-white/10 p-0.5 text-xs">
          {(
            [
              { id: "mobile", label: "Móvil", Icon: Smartphone },
              { id: "desktop", label: "Escritorio", Icon: Monitor },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStrategy(id)}
              aria-pressed={strategy === id}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors ${
                strategy === id
                  ? "bg-sky-500/15 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
          Analizando con PageSpeed Insights… puede tardar hasta 30 s.
        </div>
      ) : error ? (
        <p className="text-sm text-gray-500">No se pudo obtener el análisis: {error}</p>
      ) : summary ? (
        <>
          <StrategyView result={strategy === "mobile" ? summary.mobile : summary.desktop} />
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/5 pt-3 text-xs text-gray-500">
            <span>Analizado {timeAgo(summary.fetchedAt)}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{summary.url}</span>
            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
            >
              informe completo
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </>
      ) : null}
    </div>
  );
}
