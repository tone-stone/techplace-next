import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  HandCoins,
  LineChart,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import type { ScheduledCharge } from "@/lib/crm/collections";
import type { CrmExpense } from "@/lib/crm/expense-types";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmProject } from "@/lib/crm/projects";
import type { CrmTask } from "@/lib/crm/tasks";
import type { ItTicket } from "@/lib/it/ticket-types";
import StatusBadge from "./StatusBadge";
import UpcomingCalendar, { type CalEvent } from "./UpcomingCalendar";

/**
 * "Resumen" tab: the CRM's dashboard-at-a-glance. Derives KPI tiles, a
 * 6-month revenue chart, client/project funnel bar lists, a collections
 * breakdown, and an upcoming-deliveries list — all computed client-side from
 * the already-fetched `clients`/`projects`/`payments` props (no extra
 * requests). All charts are hand-rolled inline SVG, not a charting library.
 */

// Dark surface the charts are drawn on — used for the end-dot's surface ring.
const SURFACE = "#0e1420";

/** Compact peso formatting for chart labels (e.g. `$1.2M`, `$40k`, `−$3k`), unlike the full `formatCurrencyMXN`. */
function compactMXN(value: number): string {
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${abs}`;
}

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

/** Grid of the top KPI cards (clients, projects, and the money-in/out/net/pending strip). */
function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
/*  Revenue area chart (6 months, single series)                      */
/* ------------------------------------------------------------------ */

/** Hand-drawn SVG area/line chart of monthly net flow, with a zero baseline and a labeled endpoint. */
function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 560;
  const H = 170;
  const PT = 16;
  const PB = 26;
  const PX = 10;
  const rawMax = Math.max(0, ...data.map((d) => d.value));
  const rawMin = Math.min(0, ...data.map((d) => d.value));
  const span = Math.max(1, rawMax - rawMin);
  const stepX = (W - PX * 2) / Math.max(1, data.length - 1);
  const x = (i: number) => PX + i * stepX;
  const y = (v: number) => PT + (1 - (v - rawMin) / span) * (H - PT - PB);
  const baseY = y(0);

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${baseY.toFixed(1)} L${x(0).toFixed(1)},${baseY.toFixed(1)} Z`;
  const last = data[data.length - 1];
  const hasData = data.some((d) => d.value !== 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Flujo neto (cobrado menos egresos) en los últimos 6 meses"
    >
      <defs>
        <linearGradient id="crm-rev-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="crm-rev-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="55%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#90cddd" />
        </linearGradient>
      </defs>

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
        y1={baseY}
        y2={baseY}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />

      {hasData && <path d={area} fill="url(#crm-rev-fill)" />}
      {hasData && (
        <path
          d={line}
          fill="none"
          stroke="url(#crm-rev-stroke)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {hasData && (
        <>
          <circle
            cx={x(data.length - 1)}
            cy={y(last.value)}
            r="4"
            fill="#90cddd"
            stroke={SURFACE}
            strokeWidth="2"
          />
          <text
            x={x(data.length - 1)}
            y={y(last.value) - 10}
            textAnchor="end"
            className="fill-white"
            style={{ fontSize: 12, fontWeight: 700 }}
          >
            {compactMXN(last.value)}
          </text>
        </>
      )}

      {data.map((d, i) => (
        <text
          key={d.label}
          x={x(i)}
          y={H - 8}
          textAnchor="middle"
          className="fill-gray-500"
          style={{ fontSize: 10 }}
        >
          {d.label}
        </text>
      ))}

      {!hasData && (
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          className="fill-gray-500"
          style={{ fontSize: 12 }}
        >
          Sin movimientos registrados todavía
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal ordinal bar list                                       */
/* ------------------------------------------------------------------ */

/** Horizontal bar list used for the client funnel and project-stage breakdowns. */
function BarList({ rows }: { rows: { label: string; value: number; bar: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs text-gray-400 sm:w-28">{r.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded-sm bg-white/5">
            <div
              className={`h-full rounded-l-sm rounded-r ${r.bar}`}
              style={{ width: `${Math.max(r.value === 0 ? 0 : 4, (r.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-7 shrink-0 text-right text-sm font-bold tabular-nums text-white">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

/** Renders the full overview dashboard: KPI tiles, revenue chart, funnels, collections, and upcoming deliveries. */
export default function OverviewSection({
  clients,
  projects,
  payments,
  expenses = [],
  scheduledCharges = [],
  tasks = [],
  tickets = [],
}: {
  clients: CrmClient[];
  projects: CrmProject[];
  payments: ClientPayment[];
  expenses?: CrmExpense[];
  /** Active plans' next charge — folded into "Por cobrar" as money still coming. */
  scheduledCharges?: ScheduledCharge[];
  tasks?: CrmTask[];
  tickets?: ItTicket[];
}) {
  const now = new Date();
  const activeClients = clients.filter((c) => c.status === "activo").length;
  const activeProjects = projects.filter((p) => p.status !== "completado").length;

  /** True when `isoDate` (YYYY-MM-DD) falls in the current calendar month. */
  const inThisMonth = (isoDate: string | null) => {
    if (!isoDate) return false;
    const d = new Date(`${isoDate}T00:00:00`);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const monthlyRevenue = payments
    .filter((p) => p.status === "pagado" && inThisMonth(p.paidDate))
    .reduce((sum, p) => sum + p.amount, 0);

  // Sólo egresos pagados afectan las cuentas; los programados no cuentan aún.
  const monthlyExpenses = expenses
    .filter((e) => e.status === "pagado" && inThisMonth(e.expenseDate))
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyNet = monthlyRevenue - monthlyExpenses;

  const scheduledTotal = scheduledCharges.reduce((sum, c) => sum + c.amount, 0);

  const pendingPaymentsTotal = payments
    .filter((p) => p.status === "pendiente" || p.status === "vencido")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = pendingPaymentsTotal + scheduledTotal;

  const stats: Stat[] = [
    {
      label: "Clientes activos",
      value: activeClients,
      icon: Users,
      ring: "border-sky-400/30 bg-sky-500/10",
      text: "text-sky-300",
      glow: "bg-sky-500/20",
    },
    {
      label: "Proyectos en curso",
      value: activeProjects,
      icon: Briefcase,
      ring: "border-purple-400/30 bg-purple-500/10",
      text: "text-purple-300",
      glow: "bg-purple-500/20",
    },
    {
      label: "Cobrado este mes",
      value: formatCurrencyMXN(monthlyRevenue),
      icon: TrendingUp,
      ring: "border-emerald-400/30 bg-emerald-500/10",
      text: "text-emerald-300",
      glow: "bg-emerald-500/20",
    },
    {
      label: "Egresos este mes",
      value: formatCurrencyMXN(monthlyExpenses),
      icon: TrendingDown,
      ring: "border-rose-400/30 bg-rose-500/10",
      text: "text-rose-300",
      glow: "bg-rose-500/20",
    },
    {
      label: "Neto este mes",
      value: formatCurrencyMXN(monthlyNet),
      icon: Wallet,
      ring: monthlyNet < 0 ? "border-rose-400/30 bg-rose-500/10" : "border-emerald-400/30 bg-emerald-500/10",
      text: monthlyNet < 0 ? "text-rose-300" : "text-emerald-300",
      glow: monthlyNet < 0 ? "bg-rose-500/20" : "bg-emerald-500/20",
    },
    {
      label: "Por cobrar",
      value: formatCurrencyMXN(pendingRevenue),
      icon: HandCoins,
      ring: "border-amber-400/30 bg-amber-500/10",
      text: "text-amber-300",
      glow: "bg-amber-500/20",
    },
  ];

  // Net flow: last 6 months of (cobrado − egresos), bucketed by month. A month
  // where a charge was collected and then spent nets back to ~0.
  const netByMonth = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const sameMonth = (iso: string | null) => {
      if (!iso) return false;
      const x = new Date(`${iso}T00:00:00`);
      return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
    };
    const cobrado = payments
      .filter((p) => p.status === "pagado" && sameMonth(p.paidDate))
      .reduce((sum, p) => sum + p.amount, 0);
    const gastado = expenses
      .filter((e) => e.status === "pagado" && sameMonth(e.expenseDate))
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      label: d.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""),
      value: cobrado - gastado,
    };
  });

  // Agenda: every dated thing coming up — cobros, tareas, entregas de proyecto,
  // y SLAs de soporte — para el calendario.
  const companyOf = (id: string | null) => (id ? (clients.find((c) => c.id === id)?.company ?? "") : "");
  const CLOSED_TICKETS = new Set(["resuelto", "cerrado"]);
  const calendarEvents: CalEvent[] = [
    ...payments
      .filter((p) => p.status === "pendiente" || p.status === "vencido")
      .map((p) => ({
        id: `pay-${p.id}`,
        date: p.dueDate,
        kind: "cobro" as const,
        label: formatCurrencyMXN(p.amount),
        sub: companyOf(p.clientId),
      })),
    ...scheduledCharges.map((s) => ({
      id: `sc-${s.planId}`,
      date: s.nextDueDate,
      kind: "cobro" as const,
      label: formatCurrencyMXN(s.amount),
      sub: `${s.company} · plan`,
    })),
    ...tasks
      .filter((t) => t.status !== "terminado" && t.dueDate)
      .map((t) => ({
        id: `task-${t.id}`,
        date: t.dueDate as string,
        kind: "tarea" as const,
        label: t.title,
        sub: companyOf(t.clientId) || undefined,
      })),
    ...projects
      .filter((p) => p.status !== "completado" && p.dueDate)
      .map((p) => ({
        id: `proj-${p.id}`,
        date: p.dueDate as string,
        kind: "proyecto" as const,
        label: p.name,
        sub: companyOf(p.clientId) || undefined,
      })),
    ...tickets
      .filter((t) => !CLOSED_TICKETS.has(t.status) && t.slaDueAt)
      .map((t) => ({
        id: `tk-${t.id}`,
        date: (t.slaDueAt as string).slice(0, 10),
        kind: "soporte" as const,
        label: `${t.number} · ${t.subject}`,
        sub: "SLA",
      })),
  ];

  // Client funnel (ordinal — order is the meaning). Blue ramp: sky 300 → 600.
  const clientFunnel = [
    { label: "Lead", value: clients.filter((c) => c.status === "lead").length, bar: "bg-sky-300" },
    {
      label: "En negociación",
      value: clients.filter((c) => c.status === "negociacion").length,
      bar: "bg-sky-400",
    },
    { label: "Activo", value: clients.filter((c) => c.status === "activo").length, bar: "bg-sky-500" },
    {
      label: "Inactivo",
      value: clients.filter((c) => c.status === "inactivo").length,
      bar: "bg-sky-600",
    },
  ];

  // Project stages (ordinal). Purple ramp: purple 300 → 600.
  const projectStages = [
    {
      label: "Planeación",
      value: projects.filter((p) => p.status === "planeacion").length,
      bar: "bg-purple-300",
    },
    {
      label: "En progreso",
      value: projects.filter((p) => p.status === "en_progreso").length,
      bar: "bg-purple-400",
    },
    {
      label: "En revisión",
      value: projects.filter((p) => p.status === "revision").length,
      bar: "bg-purple-500",
    },
    {
      label: "Completado",
      value: projects.filter((p) => p.status === "completado").length,
      bar: "bg-purple-600",
    },
  ];

  // Collections — part-to-whole by amount, with reserved status colors + icons.
  const paidAmount = payments
    .filter((p) => p.status === "pagado")
    .reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pendiente")
    .reduce((s, p) => s + p.amount, 0);
  const overdueAmount = payments
    .filter((p) => p.status === "vencido")
    .reduce((s, p) => s + p.amount, 0);
  const collectionSegments = [
    { label: "Pagado", value: paidAmount, bar: "bg-emerald-500", icon: CheckCircle2, text: "text-emerald-400" },
    { label: "Pendiente", value: pendingAmount, bar: "bg-amber-500", icon: Clock, text: "text-amber-400" },
    { label: "Vencido", value: overdueAmount, bar: "bg-red-500", icon: AlertTriangle, text: "text-red-400" },
    { label: "Programado", value: scheduledTotal, bar: "bg-sky-500", icon: CalendarClock, text: "text-sky-400" },
  ];
  const collectionTotal = paidAmount + pendingAmount + overdueAmount + scheduledTotal || 1;

  const recentProjects = [...projects]
    .sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <StatTiles stats={stats} />

      <p className="-mt-2 text-xs text-gray-500">
        Desglose del pendiente por cobrar: {formatCurrencyMXN(pendingPaymentsTotal)} en cobros
        pendientes/vencidos + {formatCurrencyMXN(scheduledTotal)} de {scheduledCharges.length} plan(es)
        activo(s) sin cobro pendiente.
        {pendingRevenue === 0 &&
          " Registra un plan recurrente o un cobro pendiente en el cliente para que aparezca aquí."}
      </p>

      <UpcomingCalendar events={calendarEvents} />

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-bold text-white">Flujo neto de los últimos 6 meses</h2>
          <span className="ml-1 text-xs text-gray-500">cobrado − egresos</span>
        </div>
        <RevenueChart data={netByMonth} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-300" />
            <h2 className="text-lg font-bold text-white">Embudo de clientes</h2>
          </div>
          <BarList rows={clientFunnel} />
        </div>

        <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-300" />
            <h2 className="text-lg font-bold text-white">Proyectos por estado</h2>
          </div>
          <BarList rows={projectStages} />
        </div>
      </div>

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-emerald-300" />
          <h2 className="text-lg font-bold text-white">Estado de cobranza</h2>
        </div>
        <div className="flex h-6 w-full overflow-hidden rounded-lg bg-white/5">
          {collectionSegments
            .filter((s) => s.value > 0)
            .map((s, i) => (
              <div
                key={s.label}
                className={`h-full ${s.bar}`}
                style={{
                  width: `${(s.value / collectionTotal) * 100}%`,
                  marginLeft: i === 0 ? 0 : 2,
                }}
              />
            ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {collectionSegments.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-gray-300">
              <s.icon className={`h-3.5 w-3.5 ${s.text}`} />
              {s.label}
              <span className="font-bold text-white">{formatCurrencyMXN(s.value)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-brand-blue" />
          <h2 className="text-lg font-bold text-white">Próximas entregas</h2>
        </div>
        <div className="space-y-3">
          {recentProjects.length === 0 && (
            <p className="text-sm text-gray-500">Sin proyectos registrados.</p>
          )}
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{project.name}</p>
                <p className="text-xs text-gray-400">
                  {clients.find((c) => c.id === project.clientId)?.company ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-gray-400">{project.progress}%</span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-purple-400 via-indigo-400 to-brand-blue"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <StatusBadge status={project.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
