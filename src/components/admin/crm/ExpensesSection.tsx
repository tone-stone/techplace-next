"use client";

/**
 * "Egresos" tab: the money-out ledger. Filterable by client and category,
 * with a running total and an inline "Nuevo egreso" form. An egreso can be
 * tied to a client (and, from the client's workspace, to a plan or the
 * specific cobro it offsets).
 */

import { useActionState, useMemo, useState } from "react";
import { Plus, Search, Trash2, TrendingDown } from "lucide-react";
import { createExpenseAction, deleteExpenseAction } from "@/lib/crm/expenses";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type CrmExpense } from "@/lib/crm/expense-types";
import type { CrmActionState } from "@/lib/crm/clients";
import { formatCurrencyMXN } from "@/lib/crm/format";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

export default function ExpensesSection({
  expenses,
  clients,
}: {
  expenses: CrmExpense[];
  clients: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [showNew, setShowNew] = useState(false);
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

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

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
        <NewExpenseForm
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
          {filtered.length} egreso(s) · <span className="font-semibold text-rose-300">{formatCurrencyMXN(total)}</span>
        </span>
      </div>

      <div className="space-y-2">
        {filtered.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-white">{e.concept}</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                  {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {nameOf(e.clientId)} · {e.expenseDate}
                {e.vendor ? ` · ${e.vendor}` : ""}
                {e.method ? ` · ${e.method}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-300">−{formatCurrencyMXN(e.amount)}</span>
              <button
                type="button"
                onClick={() => setToDelete(e)}
                aria-label={`Eliminar egreso ${e.concept}`}
                className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
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

/** Inline "Nuevo egreso" form. */
function NewExpenseForm({
  clients,
  defaultClientId,
  onDone,
}: {
  clients: { id: string; name: string }[];
  defaultClientId?: string;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await createExpenseAction(prev, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="concept" required placeholder="Concepto (Hosting sitio web)" className={`sm:col-span-2 ${FIELD}`} />
        <input name="amount" type="number" min="0" step="0.01" required placeholder="Monto MXN" className={FIELD} />
        <input name="expenseDate" type="date" className={FIELD} />
        <select name="category" defaultValue="otro" className={FIELD}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select name="clientId" defaultValue={defaultClientId ?? ""} className={FIELD}>
          <option value="">Sin cliente (gasto general)</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="vendor" placeholder="Proveedor (a quién le pagaste)" className={FIELD} />
        <input name="method" placeholder="Método (transferencia, tarjeta…)" className={FIELD} />
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
          className="cursor-pointer rounded-full bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
        >
          Guardar egreso
        </button>
      </div>
    </form>
  );
}
