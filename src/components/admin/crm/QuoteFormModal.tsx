"use client";

/**
 * Full-screen modal (via `ModalPortal`) for creating *or editing* a quote:
 * client picker (existing CRM client or a hand-entered prospect), a dynamic
 * list of line items that can be seeded from the service catalog, an issue
 * date, editable executive legends, and a live subtotal/tax/total preview
 * computed client-side before the server recomputes it authoritatively.
 * Pass `quote` to switch the form into edit mode (`updateQuoteAction`).
 */

import { useActionState, useMemo, useState } from "react";
import { Eye, Pencil, Plus, X } from "lucide-react";
import { createQuoteAction, updateQuoteAction, type QuoteDetail } from "@/lib/crm/quotes";
import { DEFAULT_QUOTE_TERMS } from "@/lib/crm/quote-terms";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmActionState, CrmClient } from "@/lib/crm/clients";
import type { CrmService } from "@/lib/crm/services";
import ModalPortal from "./ModalPortal";
import QuotePreview from "./QuotePreview";

type DraftItem = { concept: string; quantity: string; unitPrice: string };

const EMPTY_ITEM: DraftItem = { concept: "", quantity: "1", unitPrice: "" };
const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** Local YYYY-MM-DD for today. */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Portaled modal form for `createQuoteAction` / `updateQuoteAction`, with client-side line-item and total management. */
export default function QuoteFormModal({
  clients,
  catalogServices = [],
  lockedClientId,
  quote,
  onClose,
}: {
  clients: CrmClient[];
  /** Active-first catalog services offered as quick-add rows for the line items. */
  catalogServices?: CrmService[];
  /** When set, the client picker is pre-filled with this client and disabled. */
  lockedClientId?: string;
  /** When set, the form edits this quote instead of creating a new one. */
  quote?: QuoteDetail;
  onClose: () => void;
}) {
  const editing = Boolean(quote);
  const locked = lockedClientId ? clients.find((c) => c.id === lockedClientId) : undefined;

  const [clientId, setClientId] = useState(quote?.quote.clientId ?? locked?.id ?? "");
  const [clientName, setClientName] = useState(quote?.quote.clientName ?? locked?.name ?? "");
  const [clientCompany, setClientCompany] = useState(quote?.quote.clientCompany ?? locked?.company ?? "");
  const [clientEmail, setClientEmail] = useState(quote?.quote.clientEmail ?? locked?.email ?? "");
  const [includeTax, setIncludeTax] = useState(quote ? quote.quote.taxRate > 0 : true);
  const [items, setItems] = useState<DraftItem[]>(
    quote && quote.items.length > 0
      ? quote.items.map((it) => ({
          concept: it.concept,
          quantity: String(it.quantity),
          unitPrice: String(it.unitPrice),
        }))
      : [{ ...EMPTY_ITEM }]
  );
  const [issuedDate, setIssuedDate] = useState(quote?.quote.issuedDate || todayIso());
  const [validUntil, setValidUntil] = useState(quote?.quote.validUntil ?? "");
  const [notes, setNotes] = useState(quote?.quote.notes ?? "");
  const [terms, setTerms] = useState(quote?.quote.terms ?? DEFAULT_QUOTE_TERMS);
  const [catalogPick, setCatalogPick] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = editing
      ? await updateQuoteAction(prevState, formData)
      : await createQuoteAction(prevState, formData);
    if (result && "success" in result) onClose();
    return result;
  }, null);

  // Autofills contact fields from an existing client but leaves them
  // editable, since a quote can go out under different contact details.
  const handleSelectClient = (id: string) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setClientName(client.name);
      setClientCompany(client.company);
      setClientEmail(client.email ?? "");
    }
  };

  const updateItem = (index: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addFromCatalog = (serviceId: string) => {
    const svc = catalogServices.find((s) => s.id === serviceId);
    setCatalogPick("");
    if (!svc) return;
    setItems((prev) => {
      const next: DraftItem = {
        concept: svc.name,
        quantity: "1",
        unitPrice: svc.defaultRate > 0 ? String(svc.defaultRate) : "",
      };
      // Replace a single pristine empty row, otherwise append.
      if (prev.length === 1 && !prev[0].concept.trim() && !prev[0].unitPrice.trim()) return [next];
      return [...prev, next];
    });
  };

  const { subtotal, taxAmount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const tax = includeTax ? sub * 0.16 : 0;
    return { subtotal: sub, taxAmount: tax, total: sub + tax };
  }, [items, includeTax]);

  const numericItems = items.map((item) => ({
    concept: item.concept,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
  }));
  const itemsJson = JSON.stringify(numericItems);
  const activeCatalog = catalogServices.filter((s) => s.active);

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
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-5 top-5 -m-2 cursor-pointer rounded-full p-2 text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-5 flex items-center justify-between gap-3 pr-8">
            <h2 className="text-xl font-bold text-white">
              {editing ? `Editar cotización ${quote!.quote.number}` : "Nueva cotización"}
            </h2>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-sky-400/40 hover:text-white"
            >
              {showPreview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Volver a editar" : "Previsualizar"}
            </button>
          </div>

          <form action={formAction} className="space-y-5">
            <input type="hidden" name="items" value={itemsJson} />
            <input type="hidden" name="taxRate" value={includeTax ? "16" : "0"} />
            <input type="hidden" name="clientId" value={clientId} />
            {editing && <input type="hidden" name="quoteId" value={quote!.quote.id} />}
            {/* Kept mounted (not unmounted) while previewing so the form still submits. */}
            <input type="hidden" name="issuedDate" value={issuedDate} />
            <input type="hidden" name="validUntil" value={validUntil} />
            <input type="hidden" name="notes" value={notes} />
            <input type="hidden" name="terms" value={terms} />

            <div hidden={!showPreview}>
              <QuotePreview
                data={{
                  number: quote?.quote.number,
                  status: quote?.quote.status,
                  clientName,
                  clientCompany,
                  clientEmail,
                  issuedDate,
                  validUntil,
                  items: numericItems,
                  taxRate: includeTax ? 16 : 0,
                  notes,
                  terms,
                }}
              />
            </div>

            <div hidden={showPreview} className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Cliente</p>
                <select
                  value={clientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  disabled={Boolean(lockedClientId)}
                  className={`mb-2 w-full ${FIELD} disabled:opacity-60`}
                >
                  <option value="">Prospecto (sin cliente en el CRM)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company} — {c.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    name="clientName"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del contacto"
                    className={FIELD}
                  />
                  <input
                    name="clientCompany"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Empresa"
                    className={FIELD}
                  />
                  <input
                    name="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Email"
                    className={FIELD}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Conceptos</p>
                  <div className="flex items-center gap-2">
                    {activeCatalog.length > 0 && (
                      <select
                        value={catalogPick}
                        onChange={(e) => addFromCatalog(e.target.value)}
                        className={`${FIELD} max-w-52 py-1 text-xs`}
                        aria-label="Agregar del catálogo"
                      >
                        <option value="">+ Del catálogo…</option>
                        {activeCatalog.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                            {s.defaultRate > 0 ? ` — ${formatCurrencyMXN(s.defaultRate)}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
                      className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" /> Línea libre
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <input
                        value={item.concept}
                        onChange={(e) => updateItem(index, { concept: e.target.value })}
                        placeholder="Concepto"
                        className={`min-w-0 flex-1 ${FIELD}`}
                      />
                      <input
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: e.target.value })}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Cant."
                        className={`w-20 ${FIELD}`}
                      />
                      <input
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio"
                        className={`w-28 ${FIELD}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        aria-label="Quitar línea"
                        className="cursor-pointer rounded-full p-2 text-gray-400 hover:text-red-300 disabled:opacity-30"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                  className="h-4 w-4"
                />
                Incluir IVA (16%)
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs text-gray-400">
                  Fecha de creación
                  <input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className={`mt-1 w-full ${FIELD}`}
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Vigente hasta
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className={`mt-1 w-full ${FIELD}`}
                  />
                </label>
              </div>

              <label className="block text-xs text-gray-400">
                Notas (opcional)
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas para el cliente"
                  className={`mt-1 w-full ${FIELD}`}
                />
              </label>

              <label className="block text-xs text-gray-400">
                Condiciones y leyendas (una por línea)
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={6}
                  className={`mt-1 w-full resize-y ${FIELD}`}
                />
                <button
                  type="button"
                  onClick={() => setTerms(DEFAULT_QUOTE_TERMS)}
                  className="mt-1 cursor-pointer text-[11px] text-sky-300 hover:text-sky-200"
                >
                  Restaurar leyendas por defecto
                </button>
              </label>
            </div>

            <div hidden={showPreview} className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>{formatCurrencyMXN(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>IVA</span>
                <span>{formatCurrencyMXN(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-1 font-bold text-white">
                <span>Total</span>
                <span>{formatCurrencyMXN(total)}</span>
              </div>
            </div>

            {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
              >
                {editing ? "Guardar cambios" : "Guardar cotización"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
