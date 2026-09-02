"use client";

/**
 * "Cobranza" tab: everything outstanding to collect, in four views — Esta
 * semana (pending, due within 7 days), Vencidos (overdue), Este mes (anything
 * due in the current calendar month) and Próximos (the next charge of each
 * active plan that has nothing outstanding yet). Charges are also generated and
 * marked overdue by the daily cron (`src/lib/crm/billing-run.ts`); here staff
 * work the list with the full CRUD: "Nuevo cobro" (`recordPaymentAction`),
 * inline edit (`updatePaymentAction`), "Marcar pagado" (`markPaymentPaidAction`)
 * and "Eliminar" (`deletePaymentAction`, soft-delete). Rows update optimistically.
 */

import { useActionState, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  FileDown,
  HandCoins,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import {
  deletePaymentAction,
  deletePlanAction,
  markPaymentPaidAction,
  recordPaymentAction,
  updatePaymentAction,
  type CrmActionState,
} from "@/lib/crm/clients";
import {
  createInvoiceFromPaymentAction,
  createInvoiceFromPlanAction,
  type CrmInvoice,
} from "@/lib/crm/invoices";
import type { CollectionItem, ScheduledCharge } from "@/lib/crm/collections";
import { formatCurrencyMXN } from "@/lib/crm/format";
import { getDueDateUrgency } from "@/lib/crm/plan-status";
import { downloadInvoiceTicketPdf } from "@/lib/crm/invoice-pdf";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type View = "semana" | "vencidos" | "mes" | "programados";

const VIEWS: { id: View; label: string }[] = [
  { id: "programados", label: "Próximos" },
  { id: "semana", label: "Esta semana" },
  { id: "vencidos", label: "Vencidos" },
  { id: "mes", label: "Este mes" },
];

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

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
  clients = [],
  invoices = [],
}: {
  collections: CollectionItem[];
  scheduledCharges?: ScheduledCharge[];
  /** For the "Nuevo cobro" client picker. */
  clients?: { id: string; name: string }[];
  /** All invoices — to show the folio / offer "Generar factura" per cobro. */
  invoices?: CrmInvoice[];
}) {
  // "Próximos" es la vista principal: todos los cobros (generados + programados)
  // por fecha, el más cercano hasta arriba.
  const [view, setView] = useState<View>("programados");
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removedPlanIds, setRemovedPlanIds] = useState<Set<string>>(new Set());
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CollectionItem | null>(null);
  const [planToDelete, setPlanToDelete] = useState<ScheduledCharge | null>(null);
  const [invoicingId, setInvoicingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowOk, setRowOk] = useState<string | null>(null);

  const invoiceByPayment = useMemo(() => {
    const m = new Map<string, CrmInvoice>();
    for (const inv of invoices) if (inv.paymentId) m.set(inv.paymentId, inv);
    return m;
  }, [invoices]);

  const generateInvoice = async (item: CollectionItem) => {
    setInvoicingId(item.paymentId);
    setRowError(null);
    setRowOk(null);
    const res = await createInvoiceFromPaymentAction(item.paymentId);
    setInvoicingId(null);
    if (res && "error" in res) setRowError(res.error);
    else setRowOk("Factura generada. El cobro sigue aquí hasta que lo marques como pagado.");
    // On success `revalidatePath("/admin")` refreshes `invoices` → folio appears.
  };

  const generateFromPlan = async (planId: string) => {
    setInvoicingId(planId);
    setRowError(null);
    setRowOk(null);
    const res = await createInvoiceFromPlanAction(planId);
    setInvoicingId(null);
    if (res && "error" in res) {
      setRowError(res.error);
      return;
    }
    // El plan avanzó; el nuevo cobro + factura quedan como pendientes de pago y
    // siguen visibles aquí (ordenados por fecha) hasta que se confirme el pago.
    setRowOk("Cobro y factura generados. Siguen en Cobranza hasta que confirmes el pago.");
  };

  const downloadTicket = (item: CollectionItem, inv: CrmInvoice) =>
    downloadInvoiceTicketPdf({
      number: inv.number,
      issuedDate: inv.issuedDate,
      dueDate: inv.dueDate,
      amount: inv.amount,
      status: inv.status,
      company: item.company,
      contactName: item.contactName,
      concept: item.planName ?? "Cobro",
      method: item.method,
    });

  const live = useMemo(
    () => collections.filter((c) => !paidIds.has(c.paymentId) && !removedIds.has(c.paymentId)),
    [collections, paidIds, removedIds]
  );

  const liveScheduled = useMemo(
    () => scheduledCharges.filter((s) => !removedPlanIds.has(s.planId)),
    [scheduledCharges, removedPlanIds]
  );

  const monthWindow = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
    return { monthStart, monthEnd };
  }, []);

  /**
   * One merged, date-sorted list per view: cobros ya generados (pendiente /
   * vencido) + proyecciones del plan. "Próximos" muestra todo; las otras
   * pestañas filtran por su ventana. Siempre ordenado por fecha ascendente —
   * el más cercano hasta arriba.
   */
  const viewRows = useMemo(() => {
    const { monthStart, monthEnd } = monthWindow;

    const payPass = (c: CollectionItem) => {
      if (view === "programados") return true;
      if (view === "semana") return c.status === "pendiente" && c.daysLeft >= 0 && c.daysLeft <= 7;
      if (view === "vencidos") return c.status === "vencido" || c.daysLeft < 0;
      return c.dueDate >= monthStart && c.dueDate < monthEnd; // mes
    };
    const schedPass = (s: ScheduledCharge) => {
      if (view === "programados") return true;
      if (view === "semana") return s.daysLeft >= 0 && s.daysLeft <= 7;
      if (view === "vencidos") return s.daysLeft < 0;
      return s.nextDueDate >= monthStart && s.nextDueDate < monthEnd; // mes
    };

    const rows: (
      | { kind: "pay"; date: string; c: CollectionItem }
      | { kind: "sched"; date: string; s: ScheduledCharge }
    )[] = [
      ...live.filter(payPass).map((c) => ({ kind: "pay" as const, date: c.dueDate, c })),
      ...liveScheduled.filter(schedPass).map((s) => ({ kind: "sched" as const, date: s.nextDueDate, s })),
    ];
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return rows;
  }, [view, live, liveScheduled, monthWindow]);

  const total = viewRows.reduce((sum, r) => sum + (r.kind === "pay" ? r.c.amount : r.s.amount), 0);
  const rowCount = viewRows.length;
  const schedCount = viewRows.filter((r) => r.kind === "sched").length;

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    const { planId, clientId } = planToDelete;
    setRemovedPlanIds((prev) => new Set(prev).add(planId));
    setPlanToDelete(null);
    await deletePlanAction(planId, clientId);
  };

  const markPaid = async (item: CollectionItem) => {
    setBusyId(item.paymentId);
    await markPaymentPaidAction(item.paymentId, item.clientId);
    setBusyId(null);
    setPaidIds((prev) => new Set(prev).add(item.paymentId));
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { paymentId, clientId } = toDelete;
    setRemovedIds((prev) => new Set(prev).add(paymentId));
    setToDelete(null);
    // The action `revalidatePath("/admin")`s; the optimistic set hides it now.
    await deletePaymentAction(paymentId, clientId);
  };

  /** A projected plan charge — "Generar factura" crea el cobro real. */
  const renderSched = (s: ScheduledCharge) => {
    const urgency = getDueDateUrgency(s.nextDueDate);
    return (
      <div
        key={`sched-${s.planId}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
      >
        <div className="min-w-0">
          <p className="font-semibold text-white">
            {s.company}
            <span className="ml-2 text-sm font-normal text-gray-400">{formatCurrencyMXN(s.amount)}</span>
            <span className="ml-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
              programado
            </span>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {s.planName} · {s.billingCycle}
            {s.contactName ? ` · ${s.contactName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(urgency)}`}
          >
            <CalendarClock className="h-3.5 w-3.5" /> {s.nextDueDate} · {daysLabel(s.daysLeft)}
          </span>
          <button
            type="button"
            disabled={invoicingId === s.planId}
            onClick={() => generateFromPlan(s.planId)}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300 hover:border-sky-400/40 hover:text-white disabled:opacity-50"
          >
            <Receipt className="h-3.5 w-3.5" />{" "}
            {invoicingId === s.planId ? "Generando…" : "Generar factura"}
          </button>
          <button
            type="button"
            onClick={() => setPlanToDelete(s)}
            aria-label={`Eliminar plan ${s.planName} de ${s.company}`}
            className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  /** A real crm_payments row (pendiente / vencido). */
  const renderPay = (item: CollectionItem) => {
    if (editingId === item.paymentId) {
      return (
        <EditChargeForm
          key={`pay-${item.paymentId}`}
          item={item}
          onDone={() => setEditingId(null)}
          onCancel={() => setEditingId(null)}
        />
      );
    }
    const inv = invoiceByPayment.get(item.paymentId);
    return (
      <div
        key={`pay-${item.paymentId}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
      >
        <div className="min-w-0">
          <p className="font-semibold text-white">
            {item.company}
            <span className="ml-2 text-sm font-normal text-gray-400">{formatCurrencyMXN(item.amount)}</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {item.planName ?? "Pago suelto"}
            {item.contactName ? ` · ${item.contactName}` : ""}
            {item.method ? ` · ${item.method}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(
              getDueDateUrgency(item.dueDate)
            )}`}
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
          {inv ? (
            <button
              type="button"
              onClick={() => downloadTicket(item, inv)}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-300 hover:bg-teal-500/20"
            >
              <FileDown className="h-3.5 w-3.5" /> {inv.number} · PDF
            </button>
          ) : (
            <button
              type="button"
              disabled={invoicingId === item.paymentId}
              onClick={() => generateInvoice(item)}
              className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300 hover:border-sky-400/40 hover:text-white disabled:opacity-50"
            >
              <Receipt className="h-3.5 w-3.5" />{" "}
              {invoicingId === item.paymentId ? "Generando…" : "Generar factura"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditingId(item.paymentId)}
            aria-label={`Editar cobro de ${item.company}`}
            className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-sky-400/40 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setToDelete(item)}
            aria-label={`Eliminar cobro de ${item.company}`}
            className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <HandCoins className="h-5 w-5 text-emerald-300" /> Cobranza
        </h2>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => setShowNew((o) => !o)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            {showNew ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showNew ? "Cerrar" : "Nuevo cobro"}
          </button>
        </div>
      </div>

      {showNew && <NewChargeForm clients={clients} onDone={() => setShowNew(false)} />}

      <p className="mb-4 text-sm text-gray-400">
        {rowCount} cobro(s) · <span className="font-semibold text-white">{formatCurrencyMXN(total)}</span>
        {schedCount > 0 && (
          <span className="ml-2 text-xs text-gray-500">
            · incluye {schedCount} cargo(s) programado(s) del plan (aún sin generar)
          </span>
        )}
      </p>

      {rowError && <p className="mb-3 text-xs text-red-400">{rowError}</p>}
      {rowOk && <p className="mb-3 text-xs text-emerald-300">{rowOk}</p>}

      {rowCount === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Nada que cobrar ni programado en esta vista.
        </p>
      ) : (
        <div className="space-y-2">
          {viewRows.map((r) => (r.kind === "sched" ? renderSched(r.s) : renderPay(r.c)))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar cobro"
        body={
          toDelete
            ? `Se eliminará el cobro de ${formatCurrencyMXN(toDelete.amount)} de ${toDelete.company} (recuperable).`
            : undefined
        }
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={planToDelete !== null}
        title="Eliminar plan"
        body={
          planToDelete
            ? `Se eliminará el plan "${planToDelete.planName}" de ${planToDelete.company}. Dejará de generar cobros (recuperable).`
            : undefined
        }
        onConfirm={confirmDeletePlan}
        onClose={() => setPlanToDelete(null)}
      />
    </div>
  );
}

/** Inline "Nuevo cobro" form — a one-off charge against a client, optionally already paid. */
function NewChargeForm({
  clients,
  onDone,
}: {
  clients: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await recordPaymentAction(prev, fd);
    if (res && "success" in res) onDone();
    return res;
  }, null);

  return (
    <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select name="clientId" required defaultValue="" className={`sm:col-span-2 ${FIELD}`}>
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="amount" type="number" min="0" step="0.01" required placeholder="Monto MXN" className={FIELD} />
        <input name="dueDate" type="date" required className={FIELD} />
        <input name="method" placeholder="Método (transferencia, tarjeta…)" className={FIELD} />
        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-300">
          <input name="markPaidNow" type="checkbox" className="h-4 w-4" /> Ya está pagado
        </label>
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
          Guardar cobro
        </button>
      </div>
    </form>
  );
}

/** Inline edit for one outstanding charge: amount, due date, method and status. */
function EditChargeForm({
  item,
  onDone,
  onCancel,
}: {
  item: CollectionItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await updatePaymentAction(prev, fd);
    if (res && "success" in res) onDone();
    return res;
  }, null);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-sky-400/30 bg-white/5 p-4">
      <input type="hidden" name="paymentId" value={item.paymentId} />
      <input type="hidden" name="clientId" value={item.clientId} />
      <p className="text-xs font-medium text-gray-400">
        {item.company} · {item.planName ?? "Pago suelto"}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={item.amount}
          placeholder="Monto MXN"
          className={FIELD}
        />
        <input name="dueDate" type="date" required defaultValue={item.dueDate} className={FIELD} />
        <input
          name="method"
          defaultValue={item.method ?? ""}
          placeholder="Método (transferencia, tarjeta…)"
          className={FIELD}
        />
        <select name="status" defaultValue={item.status} className={FIELD}>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
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
  );
}
