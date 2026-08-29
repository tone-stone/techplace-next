"use client";

/**
 * Admin dashboard card for visitor-engagement analytics collected by
 * `EngagementTracker` on the landing page. Fetches aggregates from
 * `/api/monitoring/engagement` on mount (four 7-day table scans, so it's
 * lazy — only runs when the Monitoreo tab is open) and shows four blocks:
 * per-section dwell time, scroll-depth funnel, top CTA clicks, and the
 * contact-form funnel.
 */

import { useEffect, useState } from "react";
import { Loader2, MousePointerClick } from "lucide-react";
import type {
  ContactFunnel,
  CtaClick,
  ScrollDepthPoint,
  SectionEngagement,
} from "@/lib/monitoring/queries";

type Payload = {
  sections: SectionEngagement[];
  scrollDepth: ScrollDepthPoint[];
  clicks: CtaClick[];
  funnel: ContactFunnel;
};

const SECTION_LABELS: Record<string, string> = {
  home: "Hero",
  servicios: "Servicios",
  nosotros: "Nosotros",
  portafolio: "Portafolio",
  contacto: "Contacto",
};

function sectionLabel(id: string): string {
  return SECTION_LABELS[id] ?? id.replace(/[-_]/g, " ");
}

function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m} m ${String(s % 60).padStart(2, "0")} s`;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {children}
    </div>
  );
}

function BarRow({
  label,
  value,
  fillPct,
  title,
}: {
  label: string;
  value: string;
  fillPct: number;
  title?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1 truncate text-xs text-gray-300" title={title ?? label}>
        {label}
      </span>
      <span className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-white/5">
        <span
          className="block h-full rounded-full bg-sky-500"
          style={{ width: `${Math.max(2, Math.min(100, fillPct))}%` }}
        />
      </span>
      <span className="w-16 shrink-0 text-right text-xs font-bold tabular-nums text-gray-200">
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function EngagementSection() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/monitoring/engagement");
        const json = (await res.json()) as Payload | { error: string };
        if (cancelled) return;
        if ("error" in json) setError(json.error);
        else setData(json);
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

  const maxSection = data ? Math.max(1, ...data.sections.map((s) => s.avgSeconds)) : 1;
  const maxClicks = data ? Math.max(1, ...data.clicks.map((c) => c.count)) : 1;
  const funnelBase = data ? Math.max(1, data.funnel.start, data.funnel.submit) : 1;

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <MousePointerClick className="h-4 w-4 text-sky-300" />
        <h2 className="text-lg font-bold text-white">Engagement de visitantes</h2>
        <span className="ml-auto text-xs text-gray-500">últimos 7 días</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
          Cargando métricas de engagement…
        </div>
      ) : error ? (
        <p className="text-sm text-gray-500">No se pudieron cargar las métricas: {error}</p>
      ) : data ? (
        <div className="space-y-6">
          <Block title="Tiempo por sección (media por visita)">
            {data.sections.length === 0 ? (
              <p className="text-xs text-gray-500">Sin datos todavía.</p>
            ) : (
              data.sections.map((s) => (
                <BarRow
                  key={s.section}
                  label={sectionLabel(s.section)}
                  title={`${s.section} · ${s.visits} visitas`}
                  value={formatDuration(s.avgSeconds)}
                  fillPct={(s.avgSeconds / maxSection) * 100}
                />
              ))
            )}
          </Block>

          <Block title="Profundidad de scroll (% de visitas que llega)">
            {data.scrollDepth.every((d) => d.visits === 0) ? (
              <p className="text-xs text-gray-500">Sin datos todavía.</p>
            ) : (
              data.scrollDepth.map((d) => (
                <BarRow
                  key={d.depth}
                  label={`${d.depth}%`}
                  title={`${d.visits} visitas llegaron al ${d.depth}%`}
                  value={`${Math.round(d.reachedPct)}%`}
                  fillPct={d.reachedPct}
                />
              ))
            )}
          </Block>

          <Block title="Clicks en CTAs">
            {data.clicks.length === 0 ? (
              <p className="text-xs text-gray-500">Sin clicks registrados todavía.</p>
            ) : (
              data.clicks.map((c) => (
                <BarRow
                  key={c.track}
                  label={c.track.replace(/[-_]/g, " ")}
                  title={c.track}
                  value={String(c.count)}
                  fillPct={(c.count / maxClicks) * 100}
                />
              ))
            )}
          </Block>

          <Block title="Embudo del formulario de contacto">
            {data.funnel.start === 0 && data.funnel.submit === 0 ? (
              <p className="text-xs text-gray-500">Nadie ha interactuado con el formulario todavía.</p>
            ) : (
              <>
                <BarRow
                  label="Empezó a rellenar"
                  value={String(data.funnel.start)}
                  fillPct={(data.funnel.start / funnelBase) * 100}
                />
                <BarRow
                  label="Envió"
                  value={String(data.funnel.submit)}
                  fillPct={(data.funnel.submit / funnelBase) * 100}
                />
                <BarRow
                  label="Enviado con éxito"
                  value={String(data.funnel.success)}
                  fillPct={(data.funnel.success / funnelBase) * 100}
                />
                <p className="text-xs text-gray-500">
                  Conversión inicio → envío:{" "}
                  <span className="font-bold text-gray-300">
                    {data.funnel.start > 0
                      ? `${Math.round((data.funnel.submit / data.funnel.start) * 100)}%`
                      : "—"}
                  </span>
                  {data.funnel.error > 0 && ` · ${data.funnel.error} con error de envío`}
                </p>
              </>
            )}
          </Block>
        </div>
      ) : null}
    </div>
  );
}
