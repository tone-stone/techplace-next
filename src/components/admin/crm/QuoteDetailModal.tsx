"use client";

/**
 * Full-screen modal (via `ModalPortal`) for a single quote: line items,
 * totals, a status selector, and a "Descargar PDF" button that dynamically
 * imports `downloadQuotePdf` so jsPDF only loads on demand.
 */

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarClock, Eye, EyeOff, FileDown, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  deleteQuoteAction,
  getQuoteDetail,
  updateQuoteStatusAction,
  type QuoteDetail,
  type QuoteStatus,
} from "@/lib/crm/quotes";
import { createPlanFromQuoteAction, type CrmActionState, type CrmClient } from "@/lib/crm/clients";
import type { CrmService } from "@/lib/crm/services";
import { formatCurrencyMXN } from "@/lib/crm/format";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "./StatusBadge";
import ModalPortal from "./ModalPortal";
import QuoteFormModal from "./QuoteFormModal";
import QuotePreview from "./QuotePreview";

const STATUS_OPTIONS: QuoteStatus[] = ["borrador", "enviada", "aceptada", "rechazada"];

/** Portaled modal: loads the quote's detail and lets its status be updated or the PDF downloaded. */
export default function QuoteDetailModal({
  quoteId,
  clients = [],
  catalogServices = [],
  onClose,
}: {
  quoteId: string;
  clients?: CrmClient[];
  catalogServices?: CrmService[];
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const refresh = async () => {
    const data = await getQuoteDetail(quoteId);
    setDetail(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleStatusChange = async (status: QuoteStatus) => {
    if (!detail) return;
    setSavingStatus(true);
    await updateQuoteStatusAction(detail.quote.id, detail.quote.clientId, status);
    await refresh();
    setSavingStatus(false);
  };

  const handleDownload = async () => {
    if (!detail) return;
    setDownloading(true);
    const { downloadQuotePdf } = await import("@/lib/crm/quote-pdf");
    await downloadQuotePdf(detail);
    setDownloading(false);
  };

  if (editing && detail) {
    return (
      <QuoteFormModal
        quote={detail}
        clients={clients}
        catalogServices={catalogServices}
        onClose={() => {
          setEditing(false);
          refresh();
        }}
      />
    );
  }

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="tp-dark-card-crm relative my-auto max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {detail && (
          <ConfirmDialog
            open={confirmDelete}
            title="Eliminar cotización"
            body={`Se eliminará la cotización ${detail.quote.number}.`}
            onConfirm={async () => {
              await deleteQuoteAction(detail.quote.id, detail.quote.clientId);
              onClose();
            }}
            onClose={() => setConfirmDelete(false)}
          />
        )}
        <div className="absolute right-4 top-4 flex items-center gap-1">
          {detail && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                aria-label={showPreview ? "Ver detalle" : "Previsualizar"}
                className="-m-1 cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Editar cotización"
                className="-m-1 cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-sky-500/10 hover:text-sky-300"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Eliminar cotización"
                className="-m-1 cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
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

        {loading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando cotización…
          </div>
        ) : showPreview ? (
          <div className="space-y-4">
            <QuotePreview
              data={{
                number: detail.quote.number,
                status: detail.quote.status,
                clientName: detail.quote.clientName,
                clientCompany: detail.quote.clientCompany,
                clientEmail: detail.quote.clientEmail,
                issuedDate: detail.quote.issuedDate,
                validUntil: detail.quote.validUntil,
                items: detail.items.map((i) => ({
                  concept: i.concept,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                })),
                taxRate: detail.quote.taxRate,
                notes: detail.quote.notes,
                terms: detail.quote.terms,
              }}
            />
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-sky-500/20 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Descargar PDF
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white">{detail.quote.number}</h2>
                <StatusBadge status={detail.quote.status} />
              </div>
              <p className="text-sm text-gray-400">
                {detail.quote.clientName}
                {detail.quote.clientCompany ? ` · ${detail.quote.clientCompany}` : ""}
              </p>
              {detail.quote.clientEmail && <p className="text-xs text-gray-500">{detail.quote.clientEmail}</p>}
              {detail.quote.validUntil && (
                <p className="mt-1 text-xs text-gray-500">Vigente hasta {detail.quote.validUntil}</p>
              )}
            </div>

            <div className="space-y-2">
              {detail.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-white">{item.concept}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrencyMXN(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{formatCurrencyMXN(item.quantity * item.unitPrice)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>{formatCurrencyMXN(detail.quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>IVA ({detail.quote.taxRate}%)</span>
                <span>{formatCurrencyMXN(detail.quote.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1 font-bold text-white">
                <span>Total</span>
                <span>{formatCurrencyMXN(detail.quote.total)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Estado</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={savingStatus}
                    onClick={() => handleStatusChange(status)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      detail.quote.status === status
                        ? "border-sky-400 bg-sky-500/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-sky-400/40 hover:text-white"
                    }`}
                  >
                    <StatusBadge status={status} />
                  </button>
                ))}
              </div>
            </div>

            {detail.quote.status === "aceptada" && detail.quote.clientId && !detail.quote.planId && (
              <QuoteToPlan
                quoteId={detail.quote.id}
                defaultName={`Plan ${detail.quote.number}`}
                defaultAmount={detail.quote.total}
                onDone={refresh}
              />
            )}
            {detail.quote.planId && (
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                Esta cotización ya generó un plan recurrente para el cliente.
              </p>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-sky-500/20 py-2.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Descargar PDF
            </button>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}

const QTP_FIELD =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** YYYY-MM-DD for the last day of the current month. */
function endOfThisMonth(): string {
  const n = new Date();
  const d = new Date(n.getFullYear(), n.getMonth() + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Inline "convert this accepted quote into a recurring plan" form. Amount and
 * name come prefilled from the quote; cycle / cutoff day / first due date are
 * chosen here. Always confirms before creating (also builds the mirror service).
 */
function QuoteToPlan({
  quoteId,
  defaultName,
  defaultAmount,
  onDone,
}: {
  quoteId: string;
  defaultName: string;
  defaultAmount: number;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await createPlanFromQuoteAction(prev, fd);
    if (res && "success" in res) onDone();
    return res;
  }, null);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2 rounded-xl border border-sky-400/30 bg-white/5 p-4"
    >
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-300">
        <CalendarClock className="h-3.5 w-3.5" /> Convertir en plan recurrente
      </p>
      <input type="hidden" name="quoteId" value={quoteId} />
      <input name="name" defaultValue={defaultName} placeholder="Nombre del plan" className={QTP_FIELD} />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={defaultAmount}
          placeholder="Monto MXN"
          className={QTP_FIELD}
        />
        <select name="billingCycle" defaultValue="mensual" className={QTP_FIELD}>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="anual">Anual</option>
        </select>
        <label className="text-xs text-gray-400">
          Día de corte
          <input
            name="cutoffDay"
            type="number"
            min="1"
            max="31"
            defaultValue={new Date().getDate()}
            className={`mt-1 ${QTP_FIELD}`}
          />
        </label>
        <label className="text-xs text-gray-400">
          Primer vencimiento
          <input name="nextDueDate" type="date" defaultValue={endOfThisMonth()} className={`mt-1 ${QTP_FIELD}`} />
        </label>
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full cursor-pointer rounded-lg bg-sky-500/20 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
      >
        Crear plan
      </button>

      <ConfirmDialog
        open={confirming}
        tone="info"
        title="Crear plan desde la cotización"
        body="Se creará un plan de cobro recurrente y su servicio para el cliente, con los datos de arriba."
        confirmLabel="Crear plan"
        onConfirm={() => {
          setConfirming(false);
          formRef.current?.requestSubmit();
        }}
        onClose={() => setConfirming(false)}
      />
    </form>
  );
}
