"use client";

/**
 * "Soporte" tab: the IT Service Desk ticket queue. Filter by status, by
 * assignee ("Míos"), and by client; search by number or subject. "Nuevo
 * ticket" opens an inline form; a row opens `TicketDetailModal` for the
 * thread, events and status/priority/assignee controls.
 */

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, LifeBuoy, Plus, Search } from "lucide-react";
import { createTicketAction } from "@/lib/it/tickets";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type ItTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/it/ticket-types";
import type { CrmActionState } from "@/lib/crm/clients";
import type { AssignableUser } from "@/lib/auth/users";
import TicketDetailModal from "./TicketDetailModal";

const STATUS_CLASS: Record<TicketStatus, string> = {
  nuevo: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  abierto: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  en_progreso: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  en_espera: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  resuelto: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  cerrado: "border-white/15 bg-white/5 text-gray-400",
};

const PRIORITY_CLASS: Record<TicketPriority, string> = {
  baja: "text-gray-400",
  media: "text-sky-300",
  alta: "text-amber-300",
  critica: "text-red-400",
};

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

type Picker = { id: string; name: string; clientId?: string };

function slaBreached(t: ItTicket): boolean {
  if (!t.slaDueAt || t.status === "resuelto" || t.status === "cerrado") return false;
  return new Date(t.slaDueAt).getTime() < Date.now();
}

export default function TicketsSection({
  tickets,
  clients,
  assignees = [],
  contacts = [],
  assets = [],
  currentUserId = "",
}: {
  tickets: ItTicket[];
  clients: Picker[];
  assignees?: AssignableUser[];
  contacts?: Picker[];
  assets?: Picker[];
  currentUserId?: string;
}) {
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "todos" | "abiertos">("abiertos");
  const [mineOnly, setMineOnly] = useState(false);
  const [clientFilter, setClientFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const nameOf = (list: Picker[], id: string | null) =>
    id ? (list.find((x) => x.id === id)?.name ?? "—") : null;
  const assigneeName = (id: string | null) =>
    id ? (assignees.find((u) => u.id === id)?.name ?? "—") : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter === "abiertos" && (t.status === "resuelto" || t.status === "cerrado")) return false;
      if (statusFilter !== "todos" && statusFilter !== "abiertos" && t.status !== statusFilter) return false;
      if (mineOnly && t.assigneeId !== currentUserId) return false;
      if (clientFilter !== "todos" && t.clientId !== clientFilter) return false;
      if (q && !t.subject.toLowerCase().includes(q) && !t.number.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tickets, statusFilter, mineOnly, clientFilter, query, currentUserId]);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <LifeBuoy className="h-5 w-5 text-sky-300" /> Soporte ({filtered.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ticket…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNew((o) => !o)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            <Plus className="h-4 w-4" /> Nuevo ticket
          </button>
        </div>
      </div>

      {showNew && (
        <NewTicketForm
          clients={clients}
          assignees={assignees}
          contacts={contacts}
          assets={assets}
          currentUserId={currentUserId}
          onDone={() => setShowNew(false)}
        />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "todos" | "abiertos")}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
        >
          <option value="abiertos">Abiertos</option>
          <option value="todos">Todos</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
        >
          <option value="todos">Todos los clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {currentUserId && (
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            aria-pressed={mineOnly}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              mineOnly
                ? "border-sky-400/40 bg-sky-500/15 text-white"
                : "border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            Míos
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpenId(t.id)}
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4 text-left transition-colors hover:border-sky-400/30"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{t.number}</span>
                <p className="font-semibold text-white">{t.subject}</p>
                {slaBreached(t) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400">
                    <AlertTriangle className="h-3 w-3" /> SLA vencido
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {nameOf(clients, t.clientId)}
                {assigneeName(t.assigneeId) ? ` · ${assigneeName(t.assigneeId)}` : " · sin asignar"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-xs font-semibold ${PRIORITY_CLASS[t.priority]}`}>
                {PRIORITY_LABELS[t.priority]}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[t.status]}`}
              >
                {STATUS_LABELS[t.status]}
              </span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay tickets en esta vista.</p>
        )}
      </div>

      {openId && (
        <TicketDetailModal
          ticketId={openId}
          clients={clients}
          assignees={assignees}
          contacts={contacts}
          assets={assets}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

/** Inline "Nuevo ticket" form. Contact/asset options are filtered to the picked client. */
function NewTicketForm({
  clients,
  assignees,
  contacts,
  assets,
  currentUserId,
  onDone,
}: {
  clients: Picker[];
  assignees: AssignableUser[];
  contacts: Picker[];
  assets: Picker[];
  currentUserId: string;
  onDone: () => void;
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await createTicketAction(prev, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  const clientContacts = contacts.filter((c) => c.clientId === clientId);
  const clientAssets = assets.filter((a) => a.clientId === clientId);

  return (
    <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="subject" required placeholder="Asunto" className={`sm:col-span-2 ${FIELD}`} />

        <select
          name="clientId"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className={FIELD}
        >
          <option value="" disabled>
            Cliente…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select name="priority" defaultValue="media" className={FIELD}>
          {TICKET_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <select name="contactId" defaultValue="" className={FIELD}>
          <option value="">Contacto (opcional)</option>
          {clientContacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select name="assetId" defaultValue="" className={FIELD}>
          <option value="">Activo relacionado (opcional)</option>
          {clientAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <select name="assigneeId" defaultValue={currentUserId || ""} className={FIELD}>
          <option value="">Sin asignar</option>
          {assignees.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
              {u.id === currentUserId ? " (yo)" : ""}
            </option>
          ))}
        </select>

        <input name="category" placeholder="Categoría (opcional)" className={FIELD} />
        <textarea
          name="description"
          rows={3}
          placeholder="Descripción del problema"
          className={`sm:col-span-2 resize-none ${FIELD}`}
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
          Crear ticket
        </button>
      </div>
    </form>
  );
}
