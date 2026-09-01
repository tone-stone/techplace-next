"use client";

/**
 * "Cobranza" tab: everything outstanding to collect, in three views —
 * Esta semana (pending, due within 7 days), Vencidos (overdue), and Este mes
 * (anything due in the current calendar month). Charges are generated and
 * marked overdue by the daily cron (`src/lib/crm/billing-run.ts`); this screen
 * is where staff work the list and hit "Marcar pagado" (reuses
 * `markPaymentPaidAction`). Rows disappear optimistically once paid.
 */

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, HandCoins } from "lucide-react";
import { markPaymentPaidAction } from "@/lib/crm/clients";
import type { CollectionItem, ScheduledCharge } from "@/lib/crm/collections";
import { formatCurrencyMXN } from "@/lib/crm/format";
import { getDueDateUrgency } from "@/lib/crm/plan-status";

type View = "semana" | "vencidos" | "mes" | "programados";

const VIEWS: { id: View; label: string }[] = [
  { id: "semana", label: "Esta semana" },
  { id: "vencidos", label: "Vencidos" },
  { id: "mes", label: "Este mes" },
  { id: "programados", label: "Programados" },
];

function urgencyBadgeClass(urgency: ReturnType<typeof getDueDateUrgency>) {
  if (urgency === "vencido") return "border-red-400/30 bg-red-500/10 text-red-300";
  if (urgency === "por_vencer") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
}

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} d de atraso`;
  if (daysLeft === 0) return "vence hoy";
  return `en ${daysLeft} d`;
}

export default function CobranzaSection({
  collections,
  scheduledCharges = [],
}: {
  collections: CollectionItem[];
  scheduledCharges?: ScheduledCharge[];
}) {
  const [view, setView] = useState<View>("semana");
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const live = useMemo(
    () => collections.filter((c) => !paidIds.has(c.paymentId)),
    [collections, paidIds]
  );

  const buckets = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    return {
      semana: live.filter((c) => c.status === "pendiente" && c.daysLeft >= 0 && c.daysLeft <= 7),
      vencidos: live.filter((c) => c.status === "vencido" || c.daysLeft < 0),
      mes: live.filter((c) => c.dueDate >= monthStart && c.dueDate < monthEnd),
    };
  }, [live]);

  const isScheduled = view === "programados";
  const paymentRows = view === "programados" ? [] : buckets[view];
  const rows = isScheduled ? scheduledCharges : paymentRows;
  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  const markPaid = async (item: CollectionItem) => {
    setBusyId(item.paymentId);
    await markPaymentPaidAction(item.paymentId, item.clientId);
    setBusyId(null);
    setPaidIds((prev) => new Set(prev).add(item.paymentId));
  };

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <HandCoins className="h-5 w-5 text-emerald-300" /> Cobranza
        </h2>
        <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
          {VIEWS.map(({ id, label }) => (
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
      </div>

      <p className="mb-4 text-sm text-gray-400">
        {rows.length} {isScheduled ? "plan(es)" : "cobro(s)"} ·{" "}
        <span className="font-semibold text-white">{formatCurrencyMXN(total)}</span>
        {isScheduled && (
          <span className="ml-2 text-xs text-gray-500">
            · el cobro se genera solo el día de corte
          </span>
        )}
      </p>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          {isScheduled ? "Ningún cliente tiene un plan activo." : "Nada que cobrar en esta vista."}
        </p>
      ) : isScheduled ? (
        <div className="space-y-2">
          {scheduledCharges.map((s) => {
            const urgency = getDueDateUrgency(s.nextDueDate);
            return (
              <div
                key={s.planId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {s.company}
                    <span className="ml-2 text-sm font-normal text-gray-400">{formatCurrencyMXN(s.amount)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {s.planName} · {s.billingCycle}
                    {s.contactName ? ` · ${s.contactName}` : ""}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(urgency)}`}
                >
                  <CalendarClock className="h-3.5 w-3.5" /> {s.nextDueDate} · {daysLabel(s.daysLeft)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {paymentRows.map((item) => {
            const urgency = getDueDateUrgency(item.dueDate);
            return (
              <div
                key={item.paymentId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {item.company}
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      {formatCurrencyMXN(item.amount)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.planName ?? "Pago suelto"}
                    {item.contactName ? ` · ${item.contactName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(urgency)}`}
                  >
                    {item.dueDate} · {daysLabel(item.daysLeft)}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === item.paymentId}
                    onClick={() => markPaid(item)}
                    className="flex cursor-pointer items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagado
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
