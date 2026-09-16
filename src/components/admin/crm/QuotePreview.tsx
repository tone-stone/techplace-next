"use client";

/**
 * On-screen "previsualización" of a quote — a paper-styled render that mirrors
 * the PDF layout (`quote-pdf.ts`): brand header, client block, line-item
 * table, totals, notes and the executive legends. Fed either a saved
 * `QuoteDetail` (from `QuoteDetailModal`) or the live draft in `QuoteFormModal`.
 * Purely presentational; money is recomputed here from the line items.
 */

import { formatCurrencyMXN } from "@/lib/crm/format";
import { quoteTermsLines } from "@/lib/crm/quote-terms";

export type QuotePreviewData = {
  number?: string | null;
  status?: string | null;
  clientName: string;
  clientCompany?: string | null;
  clientEmail?: string | null;
  issuedDate: string;
  validUntil?: string | null;
  items: { concept: string; quantity: number; unitPrice: number }[];
  taxRate: number;
  notes?: string | null;
  terms?: string | null;
};

export default function QuotePreview({ data }: { data: QuotePreviewData }) {
  const lines = data.items.filter((i) => i.concept.trim());
  const subtotal = lines.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-800 shadow-lg">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b-2 border-sky-600 pb-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark on a print-style preview */}
            <img
              src="/img/logos/techplace-wordmark.webp"
              alt="TechPlace"
              width={218}
              height={80}
              className="h-9 w-auto"
            />
            <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
              Tecnología · Desarrollo · Ciberseguridad
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tracking-wide text-slate-900">COTIZACIÓN</p>
            <p className="text-xs text-slate-500">{data.number || "BORRADOR"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-wide text-slate-400">Cliente</p>
            <p className="text-sm font-medium text-slate-900">
              {data.clientCompany || data.clientName || "—"}
            </p>
            {data.clientCompany && data.clientName && (
              <p className="text-slate-500">{data.clientName}</p>
            )}
            {data.clientEmail && <p className="text-slate-500">{data.clientEmail}</p>}
          </div>
          <div className="space-y-0.5 sm:text-right">
            <p>
              <span className="text-slate-400">Fecha: </span>
              {data.issuedDate || "—"}
            </p>
            {data.validUntil && (
              <p>
                <span className="text-slate-400">Vigencia: </span>
                {data.validUntil}
              </p>
            )}
            {data.status && (
              <p>
                <span className="text-slate-400">Estado: </span>
                {data.status}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-sky-600 text-white">
                <th className="p-2 text-left font-semibold">Concepto</th>
                <th className="p-2 text-center font-semibold">Cant.</th>
                <th className="p-2 text-right font-semibold">P. unitario</th>
                <th className="p-2 text-right font-semibold">Importe</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((it, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="p-2 text-slate-700">{it.concept}</td>
                  <td className="p-2 text-center text-slate-700">{it.quantity}</td>
                  <td className="p-2 text-right text-slate-700">{formatCurrencyMXN(it.unitPrice)}</td>
                  <td className="p-2 text-right font-medium text-slate-900">
                    {formatCurrencyMXN(it.quantity * it.unitPrice)}
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-slate-400">
                    Sin conceptos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-end">
          <div className="w-full max-w-60 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrencyMXN(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IVA ({data.taxRate}%)</span>
              <span>{formatCurrencyMXN(taxAmount)}</span>
            </div>
            <div className="flex justify-between bg-sky-600 px-2 py-1 font-bold text-white">
              <span>TOTAL</span>
              <span>{formatCurrencyMXN(total)}</span>
            </div>
          </div>
        </div>

        {data.notes && (
          <div className="mt-4 text-xs">
            <p className="font-semibold uppercase tracking-wide text-slate-400">Notas</p>
            <p className="whitespace-pre-line text-slate-600">{data.notes}</p>
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Condiciones
          </p>
          <ul className="list-disc space-y-0.5 pl-4 text-[10px] leading-relaxed text-slate-500">
            {quoteTermsLines(data.terms).map((legend, i) => (
              <li key={i}>{legend}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
