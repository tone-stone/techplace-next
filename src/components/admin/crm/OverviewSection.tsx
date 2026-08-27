import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  HandCoins,
  LineChart,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmProject } from "@/lib/crm/projects";
import StatusBadge from "./StatusBadge";

// Dark surface the charts are drawn on — used for the end-dot's surface ring.
const SURFACE = "#0e1420";

function compactMXN(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
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
/*  Revenue area chart (6 months, single series)                      */
/* ------------------------------------------------------------------ */

function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const W = 560;
  const H = 170;
  const PT = 16;
  const PB = 26;
  const PX = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = (W - PX * 2) / Math.max(1, data.length - 1);
  const x = (i: number) => PX + i * stepX;
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - PB} L${x(0).toFixed(1)},${H - PB} Z`;
  const last = data[data.length - 1];
  const hasData = data.some((d) => d.value > 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Ingresos cobrados en los últimos 6 meses"
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
        y1={H - PB}
        y2={H - PB}
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
          Sin pagos registrados todavía
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal ordinal bar list                                       */
/* ------------------------------------------------------------------ */

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

export default function OverviewSection({
  clients,
  projects,
  payments,
}: {
  clients: CrmClient[];
  projects: CrmProject[];
  payments: ClientPayment[];
}) {
  const now = new Date();
  const activeClients = clients.filter((c) => c.status === "activo").length;
  const activeProjects = projects.filter((p) => p.status !== "completado").length;

  const monthlyRevenue = payments
    .filter((p) => {
      if (p.status !== "pagado" || !p.paidDate) return false;
      const paid = new Date(`${p.paidDate}T00:00:00`);
      return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter((p) => p.status === "pendiente" || p.status === "vencido")
    .reduce((sum, p) => sum + p.amount, 0);

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
      label: "Por cobrar",
      value: formatCurrencyMXN(pendingRevenue),
      icon: HandCoins,
      ring: "border-amber-400/30 bg-amber-500/10",
      text: "text-amber-300",
      glow: "bg-amber-500/20",
    },
  ];

  // Revenue: last 6 months of paid payments, bucketed by month.
  const revenueByMonth = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    const value = payments
      .filter((p) => {
        if (p.status !== "pagado" || !p.paidDate) return false;
        const paid = new Date(`${p.paidDate}T00:00:00`);
        return paid.getFullYear() === d.getFullYear() && paid.getMonth() === d.getMonth();
      })
      .reduce((sum, p) => sum + p.amount, 0);
    return { label: d.toLocaleDateString("es-MX", { month: "short" }).replace(".", ""), value };
  });

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
  ];
  const collectionTotal = paidAmount + pendingAmount + overdueAmount || 1;

  const recentProjects = [...projects]
    .sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <StatTiles stats={stats} />

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-indigo-300" />
          <h2 className="text-lg font-bold text-white">Ingresos de los últimos 6 meses</h2>
        </div>
        <RevenueChart data={revenueByMonth} />
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
