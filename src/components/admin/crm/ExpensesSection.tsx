"use client";

/**
 * "Egresos" tab: the money-out ledger. Filterable by client and category, with
 * running totals split into pagado / pendiente. A programmed egreso (status
 * "pendiente") does NOT affect the general accounts until it's marked paid.
 */

import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, Search, Trash2, TrendingDown } from "lucide-react";
import {
  createExpenseAction,
  deleteExpenseAction,
  markExpensePaidAction,
  updateExpenseAction,
} from "@/lib/crm/expenses";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type CrmExpense } from "@/lib/crm/expense-types";
import type { CrmActionState } from "@/lib/crm/clients";
import { formatCurrencyMXN } from "@/lib/crm/format";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

export default function ExpensesSection({
  expenses,
  clients,
  payments = [],
}: {
  expenses: CrmExpense[];
  clients: { id: string; name: string }[];
  /** Lightweight payment rows, used to label an egreso tied to the cobro it offsets. */
  payments?: { id: string; dueDate: string; amount: number }[];
}) {
  const paymentById = useMemo(() => new Map(payments.map((p) => [p.id, p])), [payments]);
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CrmExpense | null>(null);

  const nameOf = (id: string | null) => (id ? (clients.find((c) => c.id === id)?.name ?? "—") : "General");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (clientFilter === "general" ? e.clientId !== null : clientFilter !== "todos" && e.clientId !== clientFilter)
        return false;
      if (categoryFilter !== "todos" && e.category !== categoryFilter) return false;
      if (
        q &&
        !e.concept.toLowerCase().includes(q) &&
        !(e.vendor?.toLowerCase().includes(q) ?? false) &&
        !nameOf(e.clientId).toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, query, clientFilter, categoryFilter, clients]);

  const totalPaid = filtered
    .filter((e) => e.status === "pagado")
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingItems = filtered.filter((e) => e.status === "pendiente");
  const totalPending = pendingItems.reduce((sum, e) => sum + e.amount, 0);

  const markPaid = async (e: CrmExpense) => {
    setBusyId(e.id);
    await markExpensePaidAction(e.id, e.clientId);
    setBusyId(null);
  };

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
            <TrendingDown className="h-4 w-4" />
          </span>
          Egresos
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar egreso…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNew((o) => !o)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            <Plus className="h-4 w-4" /> Nuevo egreso
          </button>
        </div>
      </div>

      {showNew && (
        <ExpenseForm
          key={clientFilter}
          clients={clients}
          defaultClientId={clientFilter !== "todos" && clientFilter !== "general" ? clientFilter : undefined}
          onDone={() => setShowNew(false)}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={FIELD}>
          <option value="todos">Todos</option>
          <option value="general">Generales (sin cliente)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={FIELD}>
          <option value="todos">Todas las categorías</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {filtered.length} egreso(s) · pagado{" "}
          <span className="font-semibold text-rose-300">{formatCurrencyMXN(totalPaid)}</span>
          {totalPending > 0 && (
            <>
              {" · "}
              <span className="text-amber-300">
                programado {formatCurrencyMXN(totalPending)} ({pendingItems.length})
              </span>
            </>
          )}
        </span>
      </div>

      <div className="space-y-2">
        {filtered.map((e) =>
          editingId === e.id ? (
            <ExpenseForm
              key={e.id}
              clients={clients}
              expense={e}
              onDone={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-semibold ${e.status === "pendiente" ? "text-gray-300" : "text-white"}`}>
                    {e.concept}
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                    {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
                  </span>
                  {e.status === "pendiente" && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                      programado
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {nameOf(e.clientId)} · {e.status === "pendiente" ? `paga ${e.expenseDate}` : e.expenseDate}
                  {e.vendor ? ` · ${e.vendor}` : ""}
                  {e.method ? ` · ${e.method}` : ""}
                </p>
                {e.paymentId && paymentById.has(e.paymentId) && (
                  <p className="mt-0.5 text-[11px] text-teal-300/80">
                    Ligado al cobro del {paymentById.get(e.paymentId)!.dueDate} (
                    {formatCurrencyMXN(paymentById.get(e.paymentId)!.amount)})
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-semibold ${e.status === "pendiente" ? "text-amber-300" : "text-rose-300"}`}
                >
                  −{formatCurrencyMXN(e.amount)}
                </span>
                {e.status === "pendiente" && (
                  <button
                    type="button"
                    disabled={busyId === e.id}
                    onClick={() => markPaid(e)}
                    className="flex cursor-pointer items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagado
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingId(e.id)}
                  aria-label={`Editar egreso ${e.concept}`}
                  className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-sky-400/40 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(e)}
                  aria-label={`Eliminar egreso ${e.concept}`}
                  className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay egresos que coincidan.</p>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar egreso"
        body={toDelete ? `Se eliminará "${toDelete.concept}".` : undefined}
        onConfirm={async () => {
          if (toDelete) await deleteExpenseAction(toDelete.id, toDelete.clientId);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/** Inline "Nuevo egreso" / "Editar egreso" form. */
function ExpenseForm({
  clients,
  defaultClientId,
  expense,
  onDone,
  onCancel,
}: {
  clients: { id: string; name: string }[];
  defaultClientId?: string;
  expense?: CrmExpense;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const editing = !!expense;
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = editing
      ? await updateExpenseAction(prev, formData)
      : await createExpenseAction(prev, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className={`mb-4 space-y-2 rounded-xl border bg-white/5 p-4 ${editing ? "border-sky-400/30" : "border-white/10"}`}
    >
      {expense && <input type="hidden" name="expenseId" value={expense.id} />}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="concept"
          required
          defaultValue={expense?.concept ?? ""}
          placeholder="Concepto (Renovación dominio)"
          className={`sm:col-span-2 ${FIELD}`}
        />
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={expense?.amount ?? ""}
          placeholder="Monto MXN"
          className={FIELD}
        />
        <label className="text-xs text-gray-400">
          Fecha (o fecha en que se pagará)
          <input
            name="expenseDate"
            type="date"
            defaultValue={expense?.expenseDate ?? ""}
            className={`mt-1 w-full ${FIELD}`}
          />
        </label>
        <select name="category" defaultValue={expense?.category ?? "otro"} className={FIELD}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        {!editing && (
          <select name="clientId" defaultValue={defaultClientId ?? ""} className={FIELD}>
            <option value="">Sin cliente (gasto general)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <input
          name="vendor"
          defaultValue={expense?.vendor ?? ""}
          placeholder="Proveedor (a quién le pagas)"
          className={FIELD}
        />
        <input
          name="method"
          defaultValue={expense?.method ?? ""}
          placeholder="Método (transferencia, tarjeta…)"
          className={FIELD}
        />
        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-300 sm:col-span-2">
          <input
            name="markPaidNow"
            type="checkbox"
            defaultChecked={expense ? expense.status === "pagado" : true}
            className="h-4 w-4"
          />
          Ya está pagado (si no, queda programado y no afecta las cuentas hasta confirmarlo)
        </label>
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel ?? onDone}
          className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
        >
          {editing ? "Guardar cambios" : "Guardar egreso"}
        </button>
      </div>
    </form>
  );
}
