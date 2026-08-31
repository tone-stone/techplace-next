"use client";

/**
 * Contract detail modal: the contract's terms (editable in place), its
 * catalog-service lines (add / remove), and delete. Fetches
 * `getContractDetail` on mount and refetches after each mutation.
 */

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import {
  addContractServiceAction,
  deleteContractAction,
  getContractDetail,
  removeContractServiceAction,
  updateContractAction,
} from "@/lib/crm/contracts";
import {
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  UNIT_LABELS,
  type ContractDetail,
} from "@/lib/crm/contract-types";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmService } from "@/lib/crm/services";
import type { CrmActionState } from "@/lib/crm/clients";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ModalPortal from "./ModalPortal";

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

export default function ContractDetailModal({
  contractId,
  clients,
  services,
  onClose,
}: {
  contractId: string;
  clients: { id: string; name: string }[];
  services: CrmService[];
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = async () => {
    setDetail(await getContractDetail(contractId));
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const c = detail?.contract;
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "—";
  const clientName = c ? (clients.find((x) => x.id === c.clientId)?.name ?? "—") : "";

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="tp-dark-card-crm relative my-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute right-4 top-4 flex items-center gap-1">
            {detail && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Eliminar contrato"
                className="-m-1 cursor-pointer rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-m-1 cursor-pointer rounded-full p-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading || !detail || !c ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando contrato…
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">{c.title}</h2>
                <p className="text-sm text-gray-400">{clientName}</p>
              </div>

              {editing ? (
                <ContractForm
                  detail={detail}
                  onDone={() => setEditing(false)}
                  onSaved={() => {
                    setEditing(false);
                    refresh();
                  }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-white/5 bg-white/2 p-3 text-xs text-gray-400">
                  <span>Estado: <span className="text-gray-200">{CONTRACT_STATUS_LABELS[c.status]}</span></span>
                  <span>Vigencia: <span className="text-gray-200">{c.startDate ?? "—"} → {c.endDate ?? "—"}</span></span>
                  <span>Horas incluidas: <span className="text-gray-200">{c.includedHours ?? "—"}</span></span>
                  <span>SLA: <span className="text-gray-200">{c.slaHours != null ? `${c.slaHours} h` : "—"}</span></span>
                  <span className="col-span-2">
                    Facturación:{" "}
                    <span className="text-gray-200">
                      {c.billingAmount != null
                        ? `${formatCurrencyMXN(c.billingAmount)}${c.billingCycle ? ` / ${c.billingCycle}` : ""}`
                        : "—"}
                    </span>
                  </span>
                  {c.notes && <span className="col-span-2 text-gray-300">{c.notes}</span>}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="col-span-2 mt-1 cursor-pointer text-left text-xs font-medium text-sky-300 hover:text-sky-200"
                  >
                    Editar contrato
                  </button>
                </div>
              )}

              <div>
                <h3 className="mb-3 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-gray-300">
                  Servicios
                </h3>
                <AddServiceLine contractId={c.id} services={services} onAdded={refresh} />
                <div className="mt-3 space-y-2">
                  {detail.services.length === 0 && (
                    <p className="text-sm text-gray-500">Sin servicios en este contrato.</p>
                  )}
                  {detail.services.map((line) => {
                    const svc = services.find((s) => s.id === line.serviceId);
                    return (
                      <div
                        key={line.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{serviceName(line.serviceId)}</p>
                          <p className="text-xs text-gray-400">
                            {line.quantity} {svc ? UNIT_LABELS[svc.unit] : ""} ·{" "}
                            {formatCurrencyMXN(line.rate ?? svc?.defaultRate ?? 0)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeContractServiceAction(line.id);
                            refresh();
                          }}
                          aria-label="Quitar servicio"
                          className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={confirmDelete}
          title="Eliminar contrato"
          body={c ? `Se eliminará ${c.title}.` : undefined}
          onConfirm={async () => {
            await deleteContractAction(contractId);
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      </div>
    </ModalPortal>
  );
}

function ContractForm({
  detail,
  onDone,
  onSaved,
}: {
  detail: ContractDetail;
  onDone: () => void;
  onSaved: () => void;
}) {
  const c = detail.contract;
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await updateContractAction(prev, formData);
    if (result && "success" in result) onSaved();
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-sky-400/30 bg-white/5 p-4">
      <input type="hidden" name="contractId" value={c.id} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="title" required defaultValue={c.title} placeholder="Título" className={`sm:col-span-2 ${FIELD}`} />
        <select name="status" defaultValue={c.status} className={FIELD}>
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTRACT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="billingCycle" defaultValue={c.billingCycle ?? ""} className={FIELD}>
          <option value="">Sin ciclo</option>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="anual">Anual</option>
        </select>
        <label className="text-xs text-gray-400">
          Inicio
          <input name="startDate" type="date" defaultValue={c.startDate ?? ""} className={`mt-1 w-full ${FIELD}`} />
        </label>
        <label className="text-xs text-gray-400">
          Fin
          <input name="endDate" type="date" defaultValue={c.endDate ?? ""} className={`mt-1 w-full ${FIELD}`} />
        </label>
        <input
          name="includedHours"
          type="number"
          min="0"
          step="0.5"
          defaultValue={c.includedHours ?? ""}
          placeholder="Horas incluidas / mes"
          className={FIELD}
        />
        <input
          name="slaHours"
          type="number"
          min="0"
          step="1"
          defaultValue={c.slaHours ?? ""}
          placeholder="SLA (horas)"
          className={FIELD}
        />
        <input
          name="billingAmount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={c.billingAmount ?? ""}
          placeholder="Monto recurrente MXN"
          className={`sm:col-span-2 ${FIELD}`}
        />
        <input name="notes" defaultValue={c.notes ?? ""} placeholder="Notas" className={`sm:col-span-2 ${FIELD}`} />
      </div>
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
          Guardar
        </button>
      </div>
    </form>
  );
}

function AddServiceLine({
  contractId,
  services,
  onAdded,
}: {
  contractId: string;
  services: CrmService[];
  onAdded: () => void;
}) {
  const active = services.filter((s) => s.active);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await addContractServiceAction(prev, formData);
    if (result && "success" in result) onAdded();
    return result;
  }, null);

  if (active.length === 0) {
    return <p className="text-xs text-gray-500">Agrega servicios al catálogo para poder incluirlos.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="contractId" value={contractId} />
      <select name="serviceId" defaultValue="" required className={`${FIELD} flex-1`}>
        <option value="" disabled>
          Servicio…
        </option>
        {active.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input name="quantity" type="number" min="0.5" step="0.5" defaultValue={1} className={`${FIELD} w-20`} aria-label="Cantidad" />
      <input name="rate" type="number" min="0" step="0.01" placeholder="Tarifa" className={`${FIELD} w-28`} aria-label="Tarifa" />
      <button
        type="submit"
        className="flex cursor-pointer items-center gap-1 rounded-full bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
      >
        <Plus className="h-3.5 w-3.5" /> Agregar
      </button>
      {state && "error" in state && <p className="w-full text-xs text-red-400">{state.error}</p>}
    </form>
  );
}
