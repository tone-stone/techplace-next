"use client";

/**
 * "Facturación" tab: an invoices table with an inline status selector per
 * row and an inline "Nueva factura" form. Shows total pending-to-collect
 * across "enviada"/"vencida" invoices.
 */

import { useActionState, useState } from "react";
import { FileDown, Plus, Trash2 } from "lucide-react";
import { formatCurrencyMXN } from "@/lib/crm/format";
import {
  createInvoiceAction,
  deleteInvoiceAction,
  updateInvoiceStatusAction,
  type CrmInvoice,
  type InvoiceStatus,
} from "@/lib/crm/invoices";
import { downloadInvoiceTicketPdf } from "@/lib/crm/invoice-pdf";
import type { CrmActionState, CrmClient } from "@/lib/crm/clients";
import type { CrmProject } from "@/lib/crm/projects";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import InvoiceDetailModal from "./InvoiceDetailModal";
import StatusBadge from "./StatusBadge";

const STATUS_OPTIONS: InvoiceStatus[] = ["borrador", "enviada", "pagada", "vencida"];

/** Renders the invoices table, pending-total summary, and the "new invoice" form. */
export default function InvoicesSection({
  invoices,
  clients,
  projects,
  readOnly = false,
}: {
  invoices: CrmInvoice[];
  clients: CrmClient[];
  projects: CrmProject[];
  /** `ejecutivo` sees Facturación but can't create or change anything. */
  readOnly?: boolean;
}) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CrmInvoice | null>(null);

  const projectName = (id: string | null) =>
    id ? (projects.find((p) => p.id === id)?.name ?? null) : null;
  const openInvoice = invoices.find((i) => i.id === openId) ?? null;

  const totalPending = invoices
    .filter((i) => i.status === "enviada" || i.status === "vencida")
    .reduce((sum, i) => sum + i.amount, 0);

  const clientName = (clientId: string) => clients.find((c) => c.id === clientId)?.company ?? "—";

  const handleStatusChange = async (invoice: CrmInvoice, status: InvoiceStatus) => {
    setUpdatingId(invoice.id);
    await updateInvoiceStatusAction(invoice.id, invoice.clientId, status);
    setUpdatingId(null);
  };

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Facturación ({invoices.length})</h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-400">
            Pendiente por cobrar: <span className="font-bold text-white">{formatCurrencyMXN(totalPending)}</span>
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowNewForm((o) => !o)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              <Plus className="h-4 w-4" /> Nueva factura
            </button>
          )}
        </div>
      </div>

      {!readOnly && showNewForm && (
        <NewInvoiceForm clients={clients} projects={projects} onDone={() => setShowNewForm(false)} />
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="pb-3 font-medium">Folio</th>
              <th className="pb-3 font-medium">Cliente</th>
              <th className="pb-3 font-medium">Emitida</th>
              <th className="pb-3 font-medium">Vence</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 text-right font-medium">Monto</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(invoice.id)}
                    className="cursor-pointer font-medium text-sky-300 underline-offset-2 hover:underline"
                  >
                    {invoice.number}
                  </button>
                </td>
                <td className="py-3 text-gray-300">{clientName(invoice.clientId)}</td>
                <td className="py-3 text-gray-400">{invoice.issuedDate}</td>
                <td className="py-3 text-gray-400">{invoice.dueDate}</td>
                <td className="py-3">
                  {readOnly ? (
                    <StatusBadge status={invoice.status} />
                  ) : (
                    <>
                      <select
                        value={invoice.status}
                        disabled={updatingId === invoice.id}
                        onChange={(e) => handleStatusChange(invoice, e.target.value as InvoiceStatus)}
                        className="cursor-pointer rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white outline-none focus:border-sky-400/40 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <span className="ml-2 hidden sm:inline">
                        <StatusBadge status={invoice.status} />
                      </span>
                    </>
                  )}
                </td>
                <td className="py-3 text-right font-semibold text-white">
                  {formatCurrencyMXN(invoice.amount)}
                </td>
                <td className="py-3 pl-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        downloadInvoiceTicketPdf({
                          number: invoice.number,
                          issuedDate: invoice.issuedDate,
                          dueDate: invoice.dueDate,
                          amount: invoice.amount,
                          status: invoice.status,
                          company: clientName(invoice.clientId),
                          contactName: null,
                          concept: invoice.notes ?? "Cobro",
                          method: null,
                        })
                      }
                      aria-label={`Descargar PDF de ${invoice.number}`}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/10 px-2 py-1 text-xs font-medium text-teal-300 hover:bg-teal-500/20"
                    >
                      <FileDown className="h-3.5 w-3.5" /> PDF
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setToDelete(invoice)}
                        aria-label="Eliminar factura"
                        className="cursor-pointer rounded p-1 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay facturas todavía.</p>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar factura"
        body={toDelete ? `Se eliminará la factura ${toDelete.number}.` : undefined}
        onConfirm={async () => {
          if (toDelete) await deleteInvoiceAction(toDelete.id, toDelete.clientId);
        }}
        onClose={() => setToDelete(null)}
      />

      {openInvoice && (
        <InvoiceDetailModal
          invoice={openInvoice}
          clientName={clientName(openInvoice.clientId)}
          projectName={projectName(openInvoice.projectId)}
          readOnly={readOnly}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

/**
 * Inline form for `createInvoiceAction`; calls `onDone` on success to
 * collapse itself. The project dropdown is scoped to whichever client is
 * currently selected.
 */
function NewInvoiceForm({
  clients,
  projects,
  onDone,
}: {
  clients: CrmClient[];
  projects: CrmProject[];
  onDone: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await createInvoiceAction(prevState, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  const clientProjects = projects.filter((p) => p.clientId === clientId);

  return (
    <form action={formAction} className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          name="clientId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 sm:col-span-2"
        >
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company} — {c.name}
            </option>
          ))}
        </select>
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          placeholder="Monto MXN"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <input
          name="dueDate"
          type="date"
          required
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
        />
        {clientProjects.length > 0 && (
          <select
            name="projectId"
            defaultValue=""
            className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 sm:col-span-2"
          >
            <option value="">Sin proyecto asociado</option>
            {clientProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
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
          Guardar factura
        </button>
      </div>
    </form>
  );
}
