import type { MonitoringReport, ReportMetric } from "./report";

/**
 * Client-side monitoring-report → PDF export, used by the "Exportar PDF"
 * button in `ReportSection`. `clientView` drops the internal-only rows
 * (raw error counts, slow ops) and keeps the plain-language summary.
 *
 * Only call from a client event handler: jsPDF / jspdf-autotable are
 * dynamically imported inside the function so they stay out of every other
 * bundle.
 */

const nf = new Intl.NumberFormat("es-MX");
const fmtInt = (v: number | null) => (v == null ? "—" : nf.format(Math.round(v)));
const fmtPct = (v: number | null) => (v == null ? "—" : `${Math.round(v)}%`);
const fmtMs = (v: number | null) => (v == null ? "—" : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
const fmtCls = (v: number | null) => (v == null ? "—" : v.toFixed(2));

/** "(+4)" / "(-3%)" / "" — sign only, no colour (PDF is B/W-friendly). */
function deltaText(m: ReportMetric, fmt: (v: number | null) => string): string {
  if (m.delta == null || Math.abs(m.delta) < (fmt === fmtCls ? 0.005 : 0.5)) return "";
  const sign = m.delta > 0 ? "+" : "-";
  const body = fmt(Math.abs(m.delta)).replace("—", "");
  return ` (${sign}${body})`;
}

const rangeLabel = (r: { since: string; until: string }) => {
  const d = (s: string) => new Date(s).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  return `${d(r.since)} — ${d(r.until)}`;
};

export async function downloadMonitoringReportPdf(
  report: MonitoringReport,
  { clientView }: { clientView: boolean },
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const host = (() => {
    try {
      return new URL(report.siteUrl).host;
    } catch {
      return report.siteUrl;
    }
  })();

  doc.setFontSize(16);
  doc.text("TechPlace — Reporte de monitoreo", 14, 18);
  doc.setFontSize(10);
  doc.text(host, 14, 25);
  doc.text(`Periodo: ${rangeLabel(report.range)}`, 14, 31);
  doc.text(`Comparado con: ${rangeLabel(report.previousRange)}`, 14, 37);
  doc.text(
    `Generado: ${new Date(report.generatedAt).toLocaleString("es-MX")}`,
    14,
    43,
  );

  const nextY = () =>
    ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 46) + 8;

  // --- Rendimiento ---
  const ps = report.performance.pagespeed;
  const psRow = (s: typeof ps.mobile, label: string) =>
    "error" in s
      ? [label, s.error, "", "", ""]
      : [
          label,
          String(s.scores.performance ?? "—"),
          String(s.scores.accessibility ?? "—"),
          String(s.scores.bestPractices ?? "—"),
          String(s.scores.seo ?? "—"),
        ];
  autoTable(doc, {
    startY: nextY(),
    head: [["PageSpeed", "Rendimiento", "Accesibilidad", "Prácticas", "SEO"]],
    body: [psRow(ps.mobile, "Móvil"), psRow(ps.desktop, "Escritorio")],
  });

  if (report.performance.webVitals.length) {
    autoTable(doc, {
      startY: nextY(),
      head: [["Web Vital (usuarios reales, p75)", "Valor", "Estado", "vs periodo previo"]],
      body: report.performance.webVitals.map((w) => {
        const fmt = w.name === "CLS" ? fmtCls : fmtMs;
        const delta =
          w.prevP75 == null ? "" : `${w.p75! - w.prevP75 > 0 ? "+" : "-"}${fmt(Math.abs(w.p75! - w.prevP75))}`;
        return [
          w.name,
          fmt(w.p75),
          { good: "OK", "needs-improvement": "A mejorar", poor: "Malo" }[w.rating ?? "needs-improvement"],
          delta,
        ];
      }),
    });
  }

  // --- Audiencia ---
  const a = report.audience;
  const DEVICE_LABEL: Record<string, string> = { mobile: "Móvil", tablet: "Tablet", desktop: "Escritorio" };
  const REF_LABEL: Record<string, string> = {
    "(direct)": "directo",
    "(internal)": "el propio sitio",
    google: "Google",
    facebook: "Facebook",
    instagram: "Instagram",
    bing: "Bing",
    twitter: "X/Twitter",
  };
  autoTable(doc, {
    startY: nextY(),
    head: [["Audiencia", "Valor", "Periodo previo"]],
    body: [
      ["Visitas", fmtInt(a.visits.value) + deltaText(a.visits, fmtInt), fmtInt(a.visits.prev)],
      ["Recurrentes", fmtPct(a.returning.value) + deltaText(a.returning, fmtPct), fmtPct(a.returning.prev)],
      ...a.devices.map((d) => [DEVICE_LABEL[d.key] ?? d.key, String(d.count), String(d.prev)]),
      ...a.referrers.map((r) => [`De ${REF_LABEL[r.key] ?? r.key}`, String(r.count), String(r.prev)]),
      ...a.scroll.map((s) => [
        `Llegaron al ${s.depth}%`,
        fmtPct(s.metric.value) + deltaText(s.metric, fmtPct),
        fmtPct(s.metric.prev),
      ]),
      ...a.topOutbound.map((o) => [`Clic a ${o.host}`, String(o.count), String(o.prev)]),
    ],
  });

  // --- Contacto ---
  const c = report.contact;
  autoTable(doc, {
    startY: nextY(),
    head: [["Formulario de contacto", "Valor", "Periodo previo"]],
    body: [
      ["Iniciaron", fmtInt(c.start.value) + deltaText(c.start, fmtInt), fmtInt(c.start.prev)],
      ["Enviaron", fmtInt(c.submit.value) + deltaText(c.submit, fmtInt), fmtInt(c.submit.prev)],
      ["Enviados OK", fmtInt(c.success.value) + deltaText(c.success, fmtInt), fmtInt(c.success.prev)],
      ["Tasa de envío", fmtPct(c.submitRate.value) + deltaText(c.submitRate, fmtPct), fmtPct(c.submitRate.prev)],
    ],
  });

  // --- Estabilidad (solo vista interna) ---
  if (!clientView) {
    autoTable(doc, {
      startY: nextY(),
      head: [["Estabilidad", "Valor", "Periodo previo"]],
      body: [
        ["Errores", fmtInt(report.stability.errors.value) + deltaText(report.stability.errors, fmtInt), fmtInt(report.stability.errors.prev)],
        ["Operaciones lentas", fmtInt(report.stability.slowOps.value) + deltaText(report.stability.slowOps, fmtInt), fmtInt(report.stability.slowOps.prev)],
      ],
    });

    if (a.topCtas.length) {
      autoTable(doc, {
        startY: nextY(),
        head: [["Clics en botones (data-track)", "Clics", "Previo"]],
        body: a.topCtas.map((t) => [t.track, String(t.count), String(t.prev)]),
      });
    }
  }

  const stamp = report.range.until.slice(0, 10);
  doc.save(`techplace-monitoreo-${stamp}${clientView ? "-cliente" : ""}.pdf`);
}
