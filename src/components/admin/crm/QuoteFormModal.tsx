"use client";

/**
 * Full-screen modal (via `ModalPortal`) for creating a new quote: client
 * picker (existing CRM client or a hand-entered prospect), a dynamic list of
 * line items, and a live subtotal/tax/total preview computed client-side
 * before the server recomputes it authoritatively in `createQuoteAction`.
 */

import { useActionState, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { createQuoteAction } from "@/lib/crm/quotes";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmActionState, CrmClient } from "@/lib/crm/clients";
import ModalPortal from "./ModalPortal";

type DraftItem = { concept: string; quantity: string; unitPrice: string };

const EMPTY_ITEM: DraftItem = { concept: "", quantity: "1", unitPrice: "" };

/** Portaled modal form for `createQuoteAction`, with client-side line-item and total management. */
export default function QuoteFormModal({
  clients,
  onClose,
}: {
  clients: CrmClient[];
  onClose: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [includeTax, setIncludeTax] = useState(true);
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);

  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await createQuoteAction(prevState, formData);
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

  const { subtotal, taxAmount, total } = useMemo(() => {
    const sub = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
    const tax = includeTax ? sub * 0.16 : 0;
    return { subtotal: sub, taxAmount: tax, total: sub + tax };
  }, [items, includeTax]);

  const itemsJson = JSON.stringify(
    items.map((item) => ({
      concept: item.concept,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    }))
  );

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

        <h2 className="mb-5 text-xl font-bold text-white">Nueva cotización</h2>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="items" value={itemsJson} />
          <input type="hidden" name="taxRate" value={includeTax ? "16" : "0"} />

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Cliente</p>
            <select
              value={clientId}
              onChange={(e) => handleSelectClient(e.target.value)}
              className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            >
              <option value="">Prospecto (sin cliente en el CRM)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} — {c.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="clientId" value={clientId} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                name="clientName"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del contacto"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
              />
              <input
                name="clientCompany"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Empresa"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
              />
              <input
                name="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Conceptos</p>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
                className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar línea
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <input
                    value={item.concept}
                    onChange={(e) => updateItem(index, { concept: e.target.value })}
                    placeholder="Concepto"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
                  />
                  <input
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cant."
                    className="w-20 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
                  />
                  <input
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    className="w-28 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              name="validUntil"
              type="date"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            />
            <input
              name="notes"
              placeholder="Notas (opcional)"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
            />
          </div>

          <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
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
              Guardar cotización
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
