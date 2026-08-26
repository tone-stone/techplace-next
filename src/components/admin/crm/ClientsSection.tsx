"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import { formatCurrencyMXN, type Client, type ClientStatus } from "@/lib/crm/mock-data";
import StatusBadge from "./StatusBadge";

const FILTERS: { id: ClientStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "lead", label: "Leads" },
  { id: "negociacion", label: "En negociación" },
  { id: "activo", label: "Activos" },
  { id: "inactivo", label: "Inactivos" },
];

export default function ClientsSection({ clients }: { clients: Client[] }) {
  const [filter, setFilter] = useState<ClientStatus | "todos">("todos");
  const [query, setQuery] = useState("");

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
      </div>

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
          <div
            key={client.id}
            className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{client.company}</p>
                <StatusBadge status={client.status} />
              </div>
              <p className="text-sm text-gray-400">
                {client.name} · {client.service}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {client.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {client.phone}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-bold text-white">{formatCurrencyMXN(client.value)}</p>
              <p className="text-xs text-gray-500">cliente desde {client.since}</p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay clientes que coincidan con este filtro.</p>
        )}
      </div>
    </div>
  );
}
