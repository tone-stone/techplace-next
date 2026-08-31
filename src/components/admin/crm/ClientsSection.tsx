"use client";

/**
 * "Clientes" tab: a filterable/searchable client list with an inline
 * "Nuevo cliente" form, and an entry point into `ClientDetailModal` for
 * plans, payments, and history.
 */

import { useActionState, useMemo, useState } from "react";
import { CalendarClock, Mail, Phone, Plus, Search } from "lucide-react";
import { createClientAction, type ClientStatus, type CrmActionState, type CrmClient } from "@/lib/crm/clients";
import type { ClientHealth } from "@/lib/crm/collections";
import { formatCurrencyMXN } from "@/lib/crm/format";
import StatusBadge from "./StatusBadge";
import ClientDetailModal from "./ClientDetailModal";

const FILTERS: { id: ClientStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "lead", label: "Leads" },
  { id: "negociacion", label: "En negociación" },
  { id: "activo", label: "Activos" },
  { id: "inactivo", label: "Inactivos" },
];

/** Renders the client list with status filters, search, and the "new client" form. */
export default function ClientsSection({
  clients,
  health = {},
}: {
  clients: CrmClient[];
  /** Per-client billing health keyed by client id (see `getClientHealthMap`). */
  health?: Record<string, ClientHealth>;
}) {
  const [filter, setFilter] = useState<ClientStatus | "todos">("todos");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesFilter = filter === "todos" || c.status === filter;
      const matchesQuery =
        query.trim() === "" ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.company.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [clients, filter, query]);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-white">Clientes y leads ({filtered.length})</h2>
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
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            <Plus className="h-4 w-4" /> Nuevo cliente
          </button>
        </div>
      </div>

      {showNewForm && <NewClientForm onDone={() => setShowNewForm(false)} />}

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? "border-sky-400 bg-sky-500/20 text-white"
                : "border-white/10 bg-white/5 text-gray-300 hover:border-sky-400/40 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => setSelectedId(client.id)}
            className="flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-white/5 bg-white/2 p-4 text-left transition-colors hover:border-sky-400/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{client.company}</p>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-sm text-gray-400">
                {client.name}
                {client.service ? ` · ${client.service}` : ""}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {client.phone}
                  </span>
                )}
              </div>
              {(() => {
                const h = health[client.id];
                if (!h) return null;
                return (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1 text-gray-400">
                      <CalendarClock className="h-3 w-3" />
                      {h.hasActivePlan && h.nextDueDate
                        ? `Próximo cobro ${h.nextDueDate}`
                        : "Sin plan activo"}
                    </span>
                    {h.overdueAmount > 0 && (
                      <span className="font-semibold text-red-400">
                        Vencido {formatCurrencyMXN(h.overdueAmount)}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay clientes que coincidan con este filtro.</p>
        )}
      </div>

      {selectedId && <ClientDetailModal clientId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

/** Inline form for `createClientAction`; calls `onDone` on success to collapse itself. */
function NewClientForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await createClientAction(prevState, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form action={formAction} className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nombre del contacto"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <input
          name="company"
          required
          placeholder="Empresa"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <input
          name="phone"
          placeholder="Teléfono"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <input
          name="service"
          placeholder="Servicio de interés"
          className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:col-span-2"
        />
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Guardar cliente
        </button>
      </div>
    </form>
  );
}
