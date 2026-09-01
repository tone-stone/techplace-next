"use client";

/**
 * "Clientes" tab: a KPI strip, a filterable/searchable client list with an
 * inline "Nuevo cliente" form. Clicking a client swaps this whole section for
 * `ClientWorkspace` (its full breakdown) without leaving the dashboard shell.
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Mail,
  Phone,
  Plus,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ClientStatus, CrmClient } from "@/lib/crm/clients";
import type { ClientHealth } from "@/lib/crm/collections";
import type { CrmProject } from "@/lib/crm/projects";
import type { CrmQuote } from "@/lib/crm/quotes";
import type { CrmInvoice } from "@/lib/crm/invoices";
import type { CrmTask } from "@/lib/crm/tasks";
import type { CrmContract } from "@/lib/crm/contracts";
import type { CrmExpense } from "@/lib/crm/expenses";
import type { ItTicket } from "@/lib/it/ticket-types";
import type { ItAsset } from "@/lib/it/asset-types";
import { formatCurrencyMXN, initialsOf } from "@/lib/crm/format";
import StatusBadge from "./StatusBadge";
import ClientForm from "./ClientForm";
import ClientWorkspace from "./ClientWorkspace";

const FILTERS: { id: ClientStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "lead", label: "Leads" },
  { id: "negociacion", label: "En negociación" },
  { id: "activo", label: "Activos" },
  { id: "inactivo", label: "Inactivos" },
];

/** Accent classes per client status: [avatar ring/tint, left card border, filter dot]. */
const STATUS_STYLES: Record<ClientStatus, { avatar: string; accent: string; dot: string }> = {
  lead: { avatar: "bg-sky-500/15 text-sky-300 ring-sky-400/40", accent: "border-l-sky-400/60", dot: "bg-sky-400" },
  negociacion: {
    avatar: "bg-amber-500/15 text-amber-300 ring-amber-400/40",
    accent: "border-l-amber-400/60",
    dot: "bg-amber-400",
  },
  activo: {
    avatar: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40",
    accent: "border-l-emerald-400/60",
    dot: "bg-emerald-400",
  },
  inactivo: {
    avatar: "bg-slate-500/15 text-slate-300 ring-slate-400/30",
    accent: "border-l-slate-500/50",
    dot: "bg-slate-400",
  },
};

/** Renders the client list with KPI strip, status filters, search, and the "new client" form. */
export default function ClientsSection({
  clients,
  health = {},
  projects = [],
  quotes = [],
  invoices = [],
  tasks = [],
  contracts = [],
  tickets = [],
  assets = [],
  expenses = [],
  serviceOptions = [],
  canWriteBilling = false,
  canReadBilling = false,
  canUseSupport = false,
}: {
  clients: CrmClient[];
  /** Per-client billing health keyed by client id (see `getClientHealthMap`). */
  health?: Record<string, ClientHealth>;
  /** All CRM/IT entities, unfiltered — the workspace slices these per client. */
  projects?: CrmProject[];
  quotes?: CrmQuote[];
  invoices?: CrmInvoice[];
  tasks?: CrmTask[];
  contracts?: CrmContract[];
  tickets?: ItTicket[];
  assets?: ItAsset[];
  expenses?: CrmExpense[];
  /** Service names suggested in the client form's "Servicio" field. */
  serviceOptions?: string[];
  /** Gates the "+ Factura" contextual action in the workspace. */
  canWriteBilling?: boolean;
  /** Gates the Servicios (contratos) panel in the workspace. */
  canReadBilling?: boolean;
  /** Gates the Soporte + Activos panels in the workspace. */
  canUseSupport?: boolean;
}) {
  const [filter, setFilter] = useState<ClientStatus | "todos">("todos");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const counts = useMemo(() => {
    const by: Record<string, number> = { todos: clients.length };
    for (const c of clients) by[c.status] = (by[c.status] ?? 0) + 1;
    return by;
  }, [clients]);

  const totalOverdue = useMemo(
    () => Object.values(health).reduce((sum, h) => sum + (h.overdueAmount || 0), 0),
    [health]
  );
  const inProcess = (counts.lead ?? 0) + (counts.negociacion ?? 0);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesFilter = filter === "todos" || c.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false);
      return matchesFilter && matchesQuery;
    });
  }, [clients, filter, query]);

  if (openId) {
    return (
      <ClientWorkspace
        clientId={openId}
        onBack={() => setOpenId(null)}
        clients={clients}
        serviceOptions={serviceOptions}
        canWriteBilling={canWriteBilling}
        canReadBilling={canReadBilling}
        canUseSupport={canUseSupport}
        related={{
          projects: projects.filter((p) => p.clientId === openId),
          quotes: quotes.filter((q) => q.clientId === openId),
          invoices: invoices.filter((i) => i.clientId === openId),
          tasks: tasks.filter((t) => t.clientId === openId),
          contracts: contracts.filter((c) => c.clientId === openId),
          tickets: tickets.filter((t) => t.clientId === openId),
          assets: assets.filter((a) => a.clientId === openId),
          expenses: expenses.filter((e) => e.clientId === openId),
        }}
      />
    );
  }

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
            <Users className="h-4 w-4" />
          </span>
          Clientes y leads ({filtered.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-sky-400/40 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNewForm((o) => !o)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-linear-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Nuevo cliente
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile icon={Users} label="Total" value={String(clients.length)} tone="sky" />
        <KpiTile icon={CheckCircle2} label="Activos" value={String(counts.activo ?? 0)} tone="emerald" />
        <KpiTile icon={TrendingUp} label="En proceso" value={String(inProcess)} tone="amber" />
        <KpiTile
          icon={AlertTriangle}
          label="Saldo vencido"
          value={totalOverdue > 0 ? formatCurrencyMXN(totalOverdue) : "Al día"}
          tone={totalOverdue > 0 ? "rose" : "slate"}
        />
      </div>

      {showNewForm && (
        <ClientForm serviceOptions={serviceOptions} onDone={() => setShowNewForm(false)} />
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const n = counts[f.id] ?? 0;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-sky-400 bg-sky-500/20 text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-sky-400/40 hover:text-white"
              }`}
            >
              {f.id !== "todos" && (
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[f.id as ClientStatus].dot}`} />
              )}
              {f.label}
              <span
                aria-hidden="true"
                className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-white/10 text-gray-400"}`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map((client) => {
          const s = STATUS_STYLES[client.status];
          const h = health[client.id];
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => setOpenId(client.id)}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border border-white/5 border-l-4 ${s.accent} bg-white/2 p-4 text-left transition-all hover:border-white/20 hover:bg-white/5`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ${s.avatar}`}
              >
                {initialsOf(client.company)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{client.company}</p>
                  <StatusBadge status={client.status} />
                </div>
                <p className="text-sm text-gray-400">
                  {client.name}
                  {client.service ? ` · ${client.service}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {client.email && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Mail className="h-3 w-3" /> {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Phone className="h-3 w-3" /> {client.phone}
                    </span>
                  )}
                  {h && (
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                        h.hasActivePlan && h.nextDueDate
                          ? "bg-sky-500/10 text-sky-300"
                          : "bg-white/5 text-gray-400"
                      }`}
                    >
                      <CalendarClock className="h-3 w-3" />
                      {h.hasActivePlan && h.nextDueDate ? `Próximo cobro ${h.nextDueDate}` : "Sin plan activo"}
                    </span>
                  )}
                  {h && h.overdueAmount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">
                      <AlertTriangle className="h-3 w-3" /> Vencido {formatCurrencyMXN(h.overdueAmount)}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-gray-600" />
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay clientes que coincidan con este filtro.</p>
        )}
      </div>
    </div>
  );
}

const KPI_TONES: Record<string, string> = {
  sky: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  rose: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
  slate: "bg-slate-500/10 text-slate-300 ring-slate-400/15",
};

/** One stat card in the KPI strip. */
function KpiTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: keyof typeof KPI_TONES | string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/2 p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${KPI_TONES[tone] ?? KPI_TONES.sky}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
