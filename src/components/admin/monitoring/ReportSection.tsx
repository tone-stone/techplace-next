"use client";

/**
 * Consolidated monitoring report: one screen that pulls performance,
 * stability, audience and the contact funnel for a chosen window, each
 * headline number shown with its delta vs the previous period of equal
 * length. Fetches `/api/monitoring/report` on mount and on range change
 * (same pattern as `PageSpeedSection`). "Vista cliente" hides the internal
 * rows; "Exportar PDF" renders the same content to a file.
 */

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, FileText, Loader2 } from "lucide-react";
import type { MonitoringReport, ReportMetric } from "@/lib/monitoring/report";
import { downloadMonitoringReportPdf } from "@/lib/monitoring/report-pdf";

type RangeKey = "7d" | "30d" | "mes-actual" | "mes-pasado";

function rangeFor(key: RangeKey): { since: string; until: string; label: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  if (key === "7d" || key === "30d") {
    const days = key === "7d" ? 7 : 30;
    return {
      since: iso(new Date(now.getTime() - days * 864e5)),
      until: iso(now),
      label: `Últimos ${days} días`,
    };
  }
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "mes-actual") {
    return { since: iso(firstThisMonth), until: iso(now), label: "Mes actual" };
  }
  const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { since: iso(firstLastMonth), until: iso(firstThisMonth), label: "Mes pasado" };
}

const RANGES: { key: RangeKey; short: string }[] = [
  { key: "7d", short: "7 días" },
  { key: "30d", short: "30 días" },
  { key: "mes-actual", short: "Mes actual" },
  { key: "mes-pasado", short: "Mes pasado" },
];

const nf = new Intl.NumberFormat("es-MX");
const fmtInt = (v: number | null) => (v == null ? "—" : nf.format(Math.round(v)));
const fmtPct = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);
const fmtMs = (v: number | null) =>
  v == null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`;
const fmtCls = (v: number | null) => (v == null ? "—" : v.toFixed(2));

const RATING_CLASS: Record<string, string> = {
  good: "text-emerald-300",
  "needs-improvement": "text-amber-300",
  poor: "text-red-300",
};
const RATING_LABEL: Record<string, string> = {
  good: "OK",
  "needs-improvement": "A mejorar",
  poor: "Malo",
};
const DEVICE_LABEL: Record<string, string> = {
  mobile: "Móvil",
  tablet: "Tablet",
  desktop: "Escritorio",
};
const REF_LABEL: Record<string, string> = {
  "(direct)": "directo",
  "(internal)": "el propio sitio",
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  bing: "Bing",
  twitter: "X/Twitter",
};

/** Wraps a `{count, prev}` pair as a ReportMetric for the delta badge. */
function countMetric({ count, prev }: { count: number; prev: number }): ReportMetric {
  return { value: count, prev, delta: count - prev, betterWhenUp: true };
}

/** ▲/▼ badge coloured by whether the change is an improvement. */
function Delta({ m, fmt }: { m: ReportMetric; fmt: (v: number | null) => string }) {
  if (m.delta == null) return <span className="text-xs text-gray-600">—</span>;
  const eps = fmt === fmtCls ? 0.005 : 0.5;
  if (Math.abs(m.delta) < eps) return <span className="text-xs text-gray-500">sin cambio</span>;
  const up = m.delta > 0;
  const good = up === m.betterWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${good ? "text-emerald-400" : "text-red-400"}`}>
      <Icon className="h-3.5 w-3.5" />
      {fmt(Math.abs(m.delta))}
    </span>
  );
}

function Row({
  label,
  value,
  metric,
  fmt,
  valueClass,
}: {
  label: string;
  value: string;
  metric?: ReportMetric;
  fmt?: (v: number | null) => string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="flex items-center gap-3">
        {metric && fmt && <Delta m={metric} fmt={fmt} />}
        <span className={`text-sm font-semibold tabular-nums ${valueClass ?? "text-white"}`}>{value}</span>
      </span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="tp-dark-card-crm rounded-2xl p-5">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h4>
      {children}
    </div>
  );
}

export default function ReportSection() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [clientView, setClientView] = useState(false);
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { since, until } = rangeFor(rangeKey);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/monitoring/report?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`,
        );
        const d = (await res.json()) as MonitoringReport | { error: string };
        if (cancelled) return;
        if ("error" in d) {
          setError(d.error);
          setReport(null);
        } else {
          setReport(d);
        }
      } catch {
        if (!cancelled) setError("No se pudo cargar el reporte");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rangeKey]);

  const ps = report?.performance.pagespeed;

  return (
    <section className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-300" />
          <h3 className="text-lg font-bold text-white">Reporte</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
            {RANGES.map(({ key, short }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRangeKey(key)}
                aria-pressed={rangeKey === key}
                className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
                  rangeKey === key ? "bg-sky-500/15 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {short}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={clientView}
              onChange={(e) => setClientView(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Vista cliente
          </label>
          <button
            type="button"
            disabled={!report}
            onClick={() => report && downloadMonitoringReportPdf(report, { clientView })}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Exportar PDF
          </button>
        </div>
      </div>

      {loading && (
        <p className="flex items-center gap-2 py-8 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Generando reporte…
        </p>
      )}

      {!loading && error && (
        <p className="py-6 text-sm text-red-300">{error}</p>
      )}

      {!loading && report && (
        <>
          <p className="mb-4 text-xs text-gray-500">
            {new Date(report.range.since).toLocaleDateString("es-MX")} –{" "}
            {new Date(report.range.until).toLocaleDateString("es-MX")} · comparado con el periodo
            previo de igual duración.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Group title="Rendimiento">
              {ps && (
                <>
                  {(["mobile", "desktop"] as const).map((k) => {
                    const s = ps[k];
                    const label = k === "mobile" ? "PageSpeed móvil" : "PageSpeed escritorio";
                    return "error" in s ? (
                      <Row key={k} label={label} value="n/d" valueClass="text-gray-500" />
                    ) : (
                      <Row
                        key={k}
                        label={label}
                        value={`P ${s.scores.performance ?? "—"} · SEO ${s.scores.seo ?? "—"}`}
                      />
                    );
                  })}
                </>
              )}
              {report.performance.webVitals.map((w) => {
                const fmt = w.name === "CLS" ? fmtCls : fmtMs;
                const dm: ReportMetric = {
                  value: w.p75,
                  prev: w.prevP75,
                  delta: w.p75 != null && w.prevP75 != null ? w.p75 - w.prevP75 : null,
                  betterWhenUp: false,
                };
                return (
                  <Row
                    key={w.name}
                    label={`${w.name} (p75)`}
                    value={`${fmt(w.p75)} · ${RATING_LABEL[w.rating ?? "needs-improvement"]}`}
                    metric={dm}
                    fmt={fmt}
                    valueClass={RATING_CLASS[w.rating ?? "needs-improvement"]}
                  />
                );
              })}
              {report.performance.webVitals.length === 0 && !ps && (
                <p className="py-2 text-xs text-gray-500">Sin datos de rendimiento en el periodo.</p>
              )}
            </Group>

            <Group title="Audiencia">
              <Row
                label="Visitas"
                value={fmtInt(report.audience.visits.value)}
                metric={report.audience.visits}
                fmt={fmtInt}
              />
              <Row
                label="Recurrentes"
                value={fmtPct(report.audience.returning.value)}
                metric={report.audience.returning}
                fmt={fmtPct}
              />
              {report.audience.devices.map((d) => (
                <Row
                  key={d.key}
                  label={DEVICE_LABEL[d.key] ?? d.key}
                  value={fmtInt(d.count)}
                  metric={countMetric(d)}
                  fmt={fmtInt}
                />
              ))}
              {report.audience.referrers.map((r) => (
                <Row
                  key={r.key}
                  label={`De ${REF_LABEL[r.key] ?? r.key}`}
                  value={fmtInt(r.count)}
                  metric={countMetric(r)}
                  fmt={fmtInt}
                />
              ))}
              {report.audience.scroll.map((s) => (
                <Row
                  key={s.depth}
                  label={`Llegaron al ${s.depth}%`}
                  value={fmtPct(s.metric.value)}
                  metric={s.metric}
                  fmt={fmtPct}
                />
              ))}
              {report.audience.topOutbound.slice(0, 4).map((o) => (
                <Row
                  key={o.host}
                  label={`→ ${o.host}`}
                  value={fmtInt(o.count)}
                  metric={countMetric({ count: o.count, prev: o.prev })}
                  fmt={fmtInt}
                />
              ))}
            </Group>

            <Group title="Formulario de contacto">
              <Row label="Iniciaron" value={fmtInt(report.contact.start.value)} metric={report.contact.start} fmt={fmtInt} />
              <Row label="Enviaron" value={fmtInt(report.contact.submit.value)} metric={report.contact.submit} fmt={fmtInt} />
              <Row label="Enviados OK" value={fmtInt(report.contact.success.value)} metric={report.contact.success} fmt={fmtInt} />
              <Row label="Tasa de envío" value={fmtPct(report.contact.submitRate.value)} metric={report.contact.submitRate} fmt={fmtPct} />
            </Group>

            {!clientView && (
              <Group title="Estabilidad">
                <Row
                  label="Errores"
                  value={fmtInt(report.stability.errors.value)}
                  metric={report.stability.errors}
                  fmt={fmtInt}
                  valueClass={report.stability.errors.value ? "text-red-300" : "text-emerald-300"}
                />
                <Row
                  label="Operaciones lentas"
                  value={fmtInt(report.stability.slowOps.value)}
                  metric={report.stability.slowOps}
                  fmt={fmtInt}
                />
                {report.audience.topCtas.length > 0 && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      className="text-xs text-sky-300 hover:underline"
                    >
                      {expanded ? "Ocultar" : "Ver"} clics en botones ({report.audience.topCtas.length})
                    </button>
                    {expanded &&
                      report.audience.topCtas.map((t) => (
                        <Row key={t.track} label={t.track} value={`${t.count}`} />
                      ))}
                  </div>
                )}
              </Group>
            )}
          </div>
        </>
      )}
    </section>
  );
}
