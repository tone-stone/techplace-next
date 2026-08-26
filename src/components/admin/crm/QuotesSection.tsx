"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatCurrencyMXN } from "@/lib/crm/format";
import { getDueDateUrgency } from "@/lib/crm/plan-status";
import type { CrmQuote } from "@/lib/crm/quotes";
import type { CrmClient } from "@/lib/crm/clients";
import StatusBadge from "./StatusBadge";
import QuoteFormModal from "./QuoteFormModal";
import QuoteDetailModal from "./QuoteDetailModal";

function urgencyBadgeClass(urgency: ReturnType<typeof getDueDateUrgency>) {
  if (urgency === "vencido") return "border-red-400/30 bg-red-500/10 text-red-300";
  if (urgency === "por_vencer") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
}

export default function QuotesSection({
  quotes,
  clients,
}: {
  quotes: CrmQuote[];
  clients: CrmClient[];
}) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Cotizaciones ({quotes.length})</h2>
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4" /> Nueva cotización
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-gray-400">
              <th className="pb-3 font-medium">Folio</th>
              <th className="pb-3 font-medium">Cliente</th>
              <th className="pb-3 font-medium">Vigente hasta</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {quotes.map((quote) => (
              <tr
                key={quote.id}
                onClick={() => setSelectedId(quote.id)}
                className="cursor-pointer hover:bg-white/2"
              >
                <td className="py-3 font-medium text-white">{quote.number}</td>
                <td className="py-3 text-gray-300">
                  {quote.clientName}
                  {quote.clientCompany ? ` · ${quote.clientCompany}` : ""}
                </td>
                <td className="py-3">
                  {quote.validUntil ? (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(
                        getDueDateUrgency(quote.validUntil)
                      )}`}
                    >
                      {quote.validUntil}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="py-3">
                  <StatusBadge status={quote.status} />
                </td>
                <td className="py-3 text-right font-semibold text-white">{formatCurrencyMXN(quote.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {quotes.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay cotizaciones todavía.</p>
        )}
      </div>

      {showNewForm && <QuoteFormModal clients={clients} onClose={() => setShowNewForm(false)} />}
      {selectedId && <QuoteDetailModal quoteId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
