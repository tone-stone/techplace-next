"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2, X } from "lucide-react";
import { getQuoteDetail, updateQuoteStatusAction, type QuoteDetail, type QuoteStatus } from "@/lib/crm/quotes";
import { formatCurrencyMXN } from "@/lib/crm/format";
import StatusBadge from "./StatusBadge";

const STATUS_OPTIONS: QuoteStatus[] = ["borrador", "enviada", "aceptada", "rechazada"];

export default function QuoteDetailModal({
  quoteId,
  onClose,
}: {
  quoteId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="tp-dark-card-crm relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-8"
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

        {loading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando cotización…
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
  );
}
