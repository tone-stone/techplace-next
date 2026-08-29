"use client";

/**
 * Admin dashboard view for the monitoring system. Renders the data fetched
 * server-side via `src/lib/monitoring/queries.ts` (recent errors, error
 * trend, Web Vitals summary, slow operations/pages, failed logins) as KPI
 * tiles, small inline SVG charts, and scrollable lists. Purely presentational
 * — all aggregation happens in the queries module; this file only formats
 * and lays out the results.
 */

import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Bug,
  ChevronDown,
  Gauge,
  MapPin,
  Server,
  ShieldAlert,
  Timer,
} from "lucide-react";
import type { ComponentType } from "react";
import type {
  ErrorStats,
  FailedLoginStats,
  MonitoringErrorEvent,
  SlowOperation,
  SlowPage,
  WebVitalSummary,
} from "@/lib/monitoring/queries";
import type { WebVitalName, WebVitalRating } from "@/lib/monitoring/types";
import PageSpeedSection from "./PageSpeedSection";
import EngagementSection from "./EngagementSection";

/* ------------------------------------------------------------------ */
/*  KPI tiles                                                          */
/* ------------------------------------------------------------------ */

type Stat = {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  ring: string;
  text: string;
  glow: string;
};

/** Grid of KPI tiles (top-line stats) shown at the head of the dashboard. */
function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="tp-dark-card-crm relative flex items-center gap-4 overflow-hidden rounded-2xl p-5"
        >
          <span
            aria-hidden
            className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${stat.glow}`}
          />
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${stat.ring}`}
          >
            <stat.icon className={`h-5 w-5 ${stat.text}`} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-2xl font-bold leading-tight">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error trend bar chart (N days)                                     */
/* ------------------------------------------------------------------ */

/** Hand-rolled inline SVG bar chart of daily error counts (no charting lib). */
function ErrorTrendChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 560;
  const H = 170;
  const PT = 16;
  const PB = 26;
  const PX = 10;
  const max = Math.max(1, ...data.map((d) => d.count));
  const barW = (W - PX * 2) / data.length;
  const hasData = data.some((d) => d.count > 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Errores por día en los últimos ${data.length} días`}
    >
      {[0.25, 0.5, 0.75].map((t) => {
        const gy = PT + t * (H - PT - PB);
        return (
          <line
            key={t}
            x1={PX}
            x2={W - PX}
            y1={gy}
            y2={gy}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}
      <line
        x1={PX}
        x2={W - PX}
        y1={H - PB}
        y2={H - PB}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />

      {data.map((d, i) => {
        const h = (d.count / max) * (H - PT - PB);
        const x = PX + i * barW;
        const showLabel = data.length <= 14 || i % Math.ceil(data.length / 14) === 0;
        return (
          <g key={d.date}>
            <rect
              x={x + barW * 0.15}
              y={H - PB - h}
              width={barW * 0.7}
              height={h}
              rx="2"
              fill={d.count > 0 ? "#f87171" : "rgba(255,255,255,0.06)"}
            />
            {showLabel && (
              <text
                x={x + barW / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-gray-500"
                style={{ fontSize: 9 }}
              >
                {d.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}

      {!hasData && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          className="fill-gray-500"
          style={{ fontSize: 12 }}
        >
          Sin errores registrados — buena señal
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Web Vitals gauges                                                  */
/* ------------------------------------------------------------------ */

const RATING_STYLE: Record<WebVitalRating, { bar: string; text: string; label: string }> = {
  good: { bar: "bg-emerald-500", text: "text-emerald-400", label: "Bien" },
  "needs-improvement": { bar: "bg-amber-500", text: "text-amber-400", label: "Mejorable" },
  poor: { bar: "bg-red-500", text: "text-red-400", label: "Mal" },
};

/** Formats a metric value for display: CLS as a 3-decimal ratio, others as rounded ms. */
function formatMetricValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

/** What each Web Vital acronym stands for and, briefly, what it measures. */
const VITAL_META: Record<WebVitalName, { full: string; hint: string }> = {
  LCP: { full: "Largest Contentful Paint", hint: "Carga del contenido principal" },
  INP: { full: "Interaction to Next Paint", hint: "Respuesta a las interacciones" },
  CLS: { full: "Cumulative Layout Shift", hint: "Estabilidad visual (saltos de diseño)" },
  TTFB: { full: "Time to First Byte", hint: "Respuesta inicial del servidor" },
  FCP: { full: "First Contentful Paint", hint: "Primer contenido visible en pantalla" },
};

/** Per-metric horizontal bar gauges showing p75 and rating for each Web Vital. */
function WebVitalsGauges({ vitals }: { vitals: WebVitalSummary[] }) {
  if (vitals.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay suficientes visitas registradas.</p>;
  }

  return (
    <div className="space-y-4">
      {vitals.map((v) => {
        const style = RATING_STYLE[v.rating];
        const meta = VITAL_META[v.name];
        // Bar fill relative to the "poor" threshold isn't stored here, so use
        // a simple 3-band split matching the KPI badge instead of a precise scale.
        const fill = v.rating === "good" ? 33 : v.rating === "needs-improvement" ? 66 : 100;
        return (
          <div key={v.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 text-xs">
                <span className="font-semibold text-gray-200" title={meta.full}>
                  {v.name}
                </span>
                <span className="ml-1.5 text-gray-500">{meta.hint}</span>
              </p>
              <span className={`shrink-0 text-xs font-bold tabular-nums ${style.text}`}>
                {formatMetricValue(v.name, v.p75)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${fill}%` }} />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-gray-500">
        p75 de los últimos 7 días · muestra: {vitals.reduce((s, v) => s + v.sampleSize, 0)} visitas
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent errors list                                                 */
/* ------------------------------------------------------------------ */

/** Formats an ISO timestamp as a coarse relative-time string, in Spanish. */
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

/** Single recent-error list item; expands to show the stack trace when present. */
function ErrorRow({ event }: { event: MonitoringErrorEvent }) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(event.stack);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        className={`flex w-full items-start gap-3 text-left ${hasDetail ? "cursor-pointer" : "cursor-default"}`}
      >
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            event.source === "server" ? "bg-purple-500/15 text-purple-300" : "bg-red-500/15 text-red-300"
          }`}
        >
          {event.source === "server" ? <Server className="h-3.5 w-3.5" /> : <Bug className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {event.message || "Error sin mensaje"}
            </p>
            {hasDetail && (
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {event.path ?? "ruta desconocida"} · {event.routeType ?? event.source} · {timeAgo(event.createdAt)}
          </p>
        </div>
      </button>
      {open && event.stack && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-gray-400">
          {event.stack}
        </pre>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slow operations (Supabase queries / auth checks over threshold)    */
/* ------------------------------------------------------------------ */

/** Scrollable list of the slowest recorded server operations, worst first. */
function SlowOperationsList({ operations }: { operations: SlowOperation[] }) {
  if (operations.length === 0) {
    return <p className="text-sm text-gray-500">Sin operaciones lentas registradas — buena señal.</p>;
  }

  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {operations.map((op) => (
        <div
          key={op.id}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
            <Timer className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{op.label}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {op.path ?? "sin ruta"} · {timeAgo(op.createdAt)}
            </p>
          </div>
          <span className="shrink-0 text-sm font-bold tabular-nums text-amber-300">
            {Math.round(op.durationMs)} ms
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slowest pages by TTFB                                              */
/* ------------------------------------------------------------------ */

/** Horizontal bar list ranking pages by TTFB p75, worst first. */
function SlowPagesBarList({ pages }: { pages: SlowPage[] }) {
  if (pages.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay suficientes visitas registradas.</p>;
  }

  const max = Math.max(1, ...pages.map((p) => p.p75));
  return (
    <div className="space-y-3">
      {pages.map((p) => (
        <div key={p.path} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-gray-400" title={p.path}>
            {p.path}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-sm bg-white/5">
            <div
              className="h-full rounded-l-sm rounded-r bg-sky-500"
              style={{ width: `${Math.max(4, (p.p75 / max) * 100)}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-sky-300">
            {Math.round(p.p75)} ms
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Failed login attempts                                               */
/* ------------------------------------------------------------------ */

/** Scrollable list of recent failed-login security events. */
function FailedLoginsList({ attempts }: { attempts: FailedLoginStats["recent"] }) {
  if (attempts.length === 0) {
    return <p className="text-sm text-gray-500">Sin intentos fallidos registrados.</p>;
  }

  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {attempts.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-300">
            <ShieldAlert className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{a.email ?? "email desconocido"}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {a.ip ?? "IP desconocida"} · {timeAgo(a.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                             */
/* ------------------------------------------------------------------ */

/**
 * Top-level monitoring dashboard section, composed of KPI tiles, the error
 * trend chart, Web Vitals gauges, and the recent-errors / slow-pages /
 * slow-operations / failed-logins lists. All data is passed in as props —
 * fetched server-side by the caller via `src/lib/monitoring/queries.ts`.
 */
export default function MonitoringSection({
  recentErrors,
  errorStats,
  webVitals,
  slowOperations,
  slowPages,
  failedLogins,
}: {
  recentErrors: MonitoringErrorEvent[];
  errorStats: ErrorStats;
  webVitals: WebVitalSummary[];
  slowOperations: SlowOperation[];
  slowPages: SlowPage[];
  failedLogins: FailedLoginStats;
}) {
  const lcp = webVitals.find((v) => v.name === "LCP");
  const inp = webVitals.find((v) => v.name === "INP");

  const stats: Stat[] = [
    {
      label: "Errores (24h)",
      value: errorStats.last24h,
      icon: AlertOctagon,
      ring: "border-red-400/30 bg-red-500/10",
      text: "text-red-300",
      glow: "bg-red-500/20",
    },
    {
      label: "Errores (7 días)",
      value: errorStats.last7d,
      icon: AlertTriangle,
      ring: "border-amber-400/30 bg-amber-500/10",
      text: "text-amber-300",
      glow: "bg-amber-500/20",
    },
    {
      label: "LCP p75",
      value: lcp ? formatMetricValue("LCP", lcp.p75) : "—",
      icon: Gauge,
      ring: "border-sky-400/30 bg-sky-500/10",
      text: "text-sky-300",
      glow: "bg-sky-500/20",
    },
    {
      label: "INP p75",
      value: inp ? formatMetricValue("INP", inp.p75) : "—",
      icon: Gauge,
      ring: "border-indigo-400/30 bg-indigo-500/10",
      text: "text-indigo-300",
      glow: "bg-indigo-500/20",
    },
    {
      label: "Logins fallidos (24h)",
      value: failedLogins.last24h,
      icon: ShieldAlert,
      ring: "border-red-400/30 bg-red-500/10",
      text: "text-red-300",
      glow: "bg-red-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <StatTiles stats={stats} />

      <PageSpeedSection />

      <EngagementSection />

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-300" />
          <h2 className="text-lg font-bold text-white">Errores por día (14 días)</h2>
        </div>
        <ErrorTrendChart data={errorStats.daily} />
      </div>

      <div className="grid gap-6 *:min-w-0 lg:grid-cols-2">
        <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-sky-300" />
            <h2 className="text-lg font-bold text-white">Web Vitals</h2>
          </div>
          <WebVitalsGauges vitals={webVitals} />
        </div>

        <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bug className="h-4 w-4 text-red-300" />
            <h2 className="text-lg font-bold text-white">Errores recientes</h2>
          </div>
          {recentErrors.length === 0 ? (
            <p className="text-sm text-gray-500">Sin errores registrados todavía.</p>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {recentErrors.map((e) => (
                <ErrorRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 *:min-w-0 lg:grid-cols-2">
        <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-sky-300" />
            <h2 className="text-lg font-bold text-white">Páginas más lentas (TTFB)</h2>
          </div>
          <SlowPagesBarList pages={slowPages} />
        </div>

        <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Timer className="h-4 w-4 text-amber-300" />
            <h2 className="text-lg font-bold text-white">Consultas y operaciones lentas</h2>
          </div>
          <SlowOperationsList operations={slowOperations} />
        </div>
      </div>

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-300" />
          <h2 className="text-lg font-bold text-white">Intentos de login fallidos</h2>
          <span className="ml-auto text-xs text-gray-500">
            {failedLogins.last7d} en los últimos 7 días
          </span>
        </div>
        <FailedLoginsList attempts={failedLogins.recent} />
      </div>
    </div>
  );
}
