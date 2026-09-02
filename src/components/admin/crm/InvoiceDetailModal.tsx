"use client";

/**
 * Read view for one invoice (via `ModalPortal`): folio, client, dates,
 * status, concept and amount, plus "Descargar PDF", an inline status change,
 * an "Editar" toggle (amount / due date / status / notes) and delete. Fed
 * straight from the row data the Facturación table already holds — no fetch.
 * Any successful mutation revalidates `/admin` and closes the modal so the
 * table shows fresh data.
 */

import { useActionState, useEffect, useState } from "react";
import { FileDown, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  deleteInvoiceAction,
  updateInvoiceAction,
  updateInvoiceStatusAction,
  type CrmInvoice,
  type InvoiceStatus,
} from "@/lib/crm/invoices";
import { downloadInvoiceTicketPdf } from "@/lib/crm/invoice-pdf";
import type { CrmActionState } from "@/lib/crm/clients";
import { formatCurrencyMXN } from "@/lib/crm/format";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "./StatusBadge";
import ModalPortal from "./ModalPortal";

const STATUS_OPTIONS: InvoiceStatus[] = ["borrador", "enviada", "pagada", "vencida"];
const FIELD =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** One "label / value" row in the read view; renders nothing when `value` is empty. */
function Line({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 py-2 text-sm last:border-0">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right text-gray-200">{value}</span>
    </div>
  );
}

export default function InvoiceDetailModal({
  invoice,
  clientName,
  projectName,
  readOnly = false,
  onClose,
}: {
  invoice: CrmInvoice;
  clientName: string;
  projectName?: string | null;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [editState, editAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await updateInvoiceAction(prev, fd);
    if (res && "success" in res) onClose();
    return res;
  }, null);

  const changeStatus = async (status: InvoiceStatus) => {
    if (status === invoice.status) return;
    setSavingStatus(true);
    await updateInvoiceStatusAction(invoice.id, invoice.clientId, status);
    setSavingStatus(false);
    onClose();
  };

  const pdf = () =>
    downloadInvoiceTicketPdf({
      number: invoice.number,
      issuedDate: invoice.issuedDate,
      dueDate: invoice.dueDate,
      amount: invoice.amount,
      status: invoice.status,
      company: clientName,
      contactName: null,
      concept: invoice.notes ?? "Cobro",
      method: null,
    });

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Factura ${invoice.number}`}
          className="tp-dark-card-crm relative my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 -m-1 cursor-pointer rounded-full p-2 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white">Factura {invoice.number}</h2>
            <StatusBadge status={invoice.status} />
          </div>

          {editing && !readOnly ? (
            <form action={editAction} className="space-y-3">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <input type="hidden" name="clientId" value={invoice.clientId} />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-gray-400">
                  Monto
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={invoice.amount}
                    className={`mt-1 ${FIELD}`}
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Vence
                  <input
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={invoice.dueDate}
                    className={`mt-1 ${FIELD}`}
                  />
                </label>
              </div>
              <label className="block text-xs text-gray-400">
                Estado
                <select name="status" defaultValue={invoice.status} className={`mt-1 ${FIELD}`}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-gray-400">
                Concepto / notas
                <input
                  name="notes"
                  defaultValue={invoice.notes ?? ""}
                  placeholder="Servicio · periodo…"
                  className={`mt-1 ${FIELD}`}
                />
              </label>
              {editState && "error" in editState && (
                <p className="text-xs text-red-400">{editState.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="rounded-xl border border-white/5 bg-white/2 px-3">
                <Line label="Cliente" value={clientName} />
                <Line label="Emitida" value={invoice.issuedDate} />
                <Line label="Vence" value={invoice.dueDate} />
                <Line label="Proyecto" value={projectName ?? null} />
                <Line label="Concepto" value={invoice.notes} />
                <Line
                  label="Cobro origen"
                  value={invoice.paymentId ? "Generada desde un cobro de cobranza" : null}
                />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/2 p-4">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-lg font-bold text-white">{formatCurrencyMXN(invoice.amount)}</span>
              </div>

              {!readOnly && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingStatus}
                        onClick={() => changeStatus(status)}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          invoice.status === status
                            ? "border-sky-400 bg-sky-500/20 text-white"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-sky-400/40 hover:text-white"
                        }`}
                      >
                        <StatusBadge status={status} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={pdf}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-teal-500/20 py-2.5 text-sm font-semibold text-teal-200 hover:bg-teal-500/30"
                >
                  <FileDown className="h-4 w-4" /> Descargar PDF
                </button>
                {!readOnly && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-sky-400/40 hover:text-white"
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      aria-label="Eliminar factura"
                      className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-400 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar factura"
        body={`Se eliminará la factura ${invoice.number}.`}
        onConfirm={async () => {
          await deleteInvoiceAction(invoice.id, invoice.clientId);
          onClose();
        }}
        onClose={() => setConfirmDelete(false)}
      />

      {savingStatus && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <Loader2 className="h-6 w-6 animate-spin text-sky-300" />
        </div>
      )}
    </ModalPortal>
  );
}
