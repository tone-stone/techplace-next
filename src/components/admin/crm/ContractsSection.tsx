"use client";

/**
 * "Contratos" tab: two views — the client contracts list (term, included
 * hours, SLA, recurring billing) with a detail modal, and the service
 * catalog those contracts draw their line items from.
 */

import { useActionState, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  createContractAction,
  type CrmContract,
} from "@/lib/crm/contracts";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
  type CrmService,
} from "@/lib/crm/services";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  SERVICE_UNITS,
  UNIT_LABELS,
  type ContractStatus,
} from "@/lib/crm/contract-types";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmActionState } from "@/lib/crm/clients";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ContractDetailModal from "./ContractDetailModal";

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

const STATUS_CLASS: Record<ContractStatus, string> = {
  borrador: "border-white/15 bg-white/5 text-gray-400",
  activo: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  suspendido: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  vencido: "border-red-400/30 bg-red-500/10 text-red-300",
  cancelado: "border-white/15 bg-white/5 text-gray-500",
};

export default function ContractsSection({
  contracts,
  services,
  clients,
}: {
  contracts: CrmContract[];
  services: CrmService[];
  clients: { id: string; name: string }[];
}) {
  const [view, setView] = useState<"contratos" | "catalogo">("contratos");
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("todos");
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const nameOf = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter((c) => {
      if (clientFilter !== "todos" && c.clientId !== clientFilter) return false;
      if (q && !c.title.toLowerCase().includes(q) && !nameOf(c.clientId).toLowerCase().includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts, query, clientFilter, clients]);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
          {(
            [
              { id: "contratos", label: "Contratos" },
              { id: "catalogo", label: "Catálogo" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-pressed={view === id}
              className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
                view === id ? "bg-sky-500/15 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "contratos" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar contrato…"
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:w-52"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowNew((o) => !o)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              <Plus className="h-4 w-4" /> Nuevo contrato
            </button>
          </div>
        )}
      </div>

      {view === "contratos" ? (
        <>
          {showNew && (
            <NewContractForm clients={clients} onDone={() => setShowNew(false)} />
          )}

          <div className="mb-4 flex flex-wrap gap-2">
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
          </div>

          <div className="space-y-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenId(c.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4 text-left transition-colors hover:border-sky-400/30"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{c.title}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[c.status]}`}>
                      {CONTRACT_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{nameOf(c.clientId)}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {c.includedHours != null && <span>{c.includedHours} h incluidas</span>}
                    {c.slaHours != null && <span>SLA {c.slaHours} h</span>}
                    {c.billingAmount != null && (
                      <span>
                        {formatCurrencyMXN(c.billingAmount)}
                        {c.billingCycle ? ` / ${c.billingCycle}` : ""}
                      </span>
                    )}
                    {c.endDate && <span>Vence {c.endDate}</span>}
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No hay contratos que coincidan.</p>
            )}
          </div>
        </>
      ) : (
        <ServiceCatalog services={services} />
      )}

      {openId && (
        <ContractDetailModal
          contractId={openId}
          clients={clients}
          services={services}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

/** Inline "Nuevo contrato" form. */
function NewContractForm({
  clients,
  onDone,
}: {
  clients: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await createContractAction(prev, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="title" required placeholder="Título (Soporte IT 2026)" className={`sm:col-span-2 ${FIELD}`} />
        <select name="clientId" defaultValue="" required className={FIELD}>
          <option value="" disabled>
            Cliente…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue="borrador" className={FIELD}>
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTRACT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="text-xs text-gray-400">
          Inicio
          <input name="startDate" type="date" className={`mt-1 w-full ${FIELD}`} />
        </label>
        <label className="text-xs text-gray-400">
          Fin
          <input name="endDate" type="date" className={`mt-1 w-full ${FIELD}`} />
        </label>
        <input name="includedHours" type="number" min="0" step="0.5" placeholder="Horas incluidas / mes" className={FIELD} />
        <input name="slaHours" type="number" min="0" step="1" placeholder="SLA (horas)" className={FIELD} />
        <input name="billingAmount" type="number" min="0" step="0.01" placeholder="Monto recurrente MXN" className={FIELD} />
        <select name="billingCycle" defaultValue="" className={FIELD}>
          <option value="">Sin ciclo</option>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="anual">Anual</option>
        </select>
        <input name="notes" placeholder="Notas (opcional)" className={`sm:col-span-2 ${FIELD}`} />
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
          Crear contrato
        </button>
      </div>
    </form>
  );
}

/** Service catalog list with inline add + per-row edit/toggle/delete. */
function ServiceCatalog({ services }: { services: CrmService[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CrmService | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-400">{services.length} servicio(s) en el catálogo</p>
        <button
          type="button"
          onClick={() => setShowAdd((o) => !o)}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo servicio
        </button>
      </div>

      {showAdd && <ServiceForm onDone={() => setShowAdd(false)} />}

      <div className="space-y-2">
        {services.map((s) =>
          editingId === s.id ? (
            <ServiceForm key={s.id} service={s} onDone={() => setEditingId(null)} />
          ) : (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-medium ${s.active ? "text-white" : "text-gray-500 line-through"}`}>{s.name}</p>
                  <span className="text-xs text-gray-400">
                    {formatCurrencyMXN(s.defaultRate)} · {UNIT_LABELS[s.unit]}
                  </span>
                </div>
                {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingId(s.id)}
                  className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(s)}
                  aria-label={`Eliminar servicio ${s.name}`}
                  className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}
        {services.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">Aún no hay servicios en el catálogo.</p>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar servicio"
        body={toDelete ? `Se eliminará ${toDelete.name} del catálogo.` : undefined}
        onConfirm={async () => {
          if (toDelete) await deleteServiceAction(toDelete.id);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function ServiceForm({ service, onDone }: { service?: CrmService; onDone: () => void }) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = service
      ? await updateServiceAction(prev, formData)
      : await createServiceAction(prev, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className={`mb-3 space-y-2 rounded-xl border bg-white/5 p-3 ${service ? "border-sky-400/30" : "border-white/10"}`}
    >
      {service && <input type="hidden" name="serviceId" value={service.id} />}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="name" required defaultValue={service?.name ?? ""} placeholder="Nombre del servicio" className={`sm:col-span-2 ${FIELD}`} />
        <select name="unit" defaultValue={service?.unit ?? "hora"} className={FIELD}>
          {SERVICE_UNITS.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABELS[u]}
            </option>
          ))}
        </select>
        <input
          name="defaultRate"
          type="number"
          min="0"
          step="0.01"
          defaultValue={service?.defaultRate ?? 0}
          placeholder="Tarifa MXN"
          className={FIELD}
        />
        <input name="description" defaultValue={service?.description ?? ""} placeholder="Descripción (opcional)" className={`sm:col-span-2 ${FIELD}`} />
      </div>
      {service && (
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input name="active" type="checkbox" defaultChecked={service.active} className="h-4 w-4" /> Activo
        </label>
      )}
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          {service ? "Guardar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}
