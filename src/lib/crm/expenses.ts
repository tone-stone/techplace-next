"use server";

/**
 * CRM expenses (egresos): the money that goes out — hosting, domains, tools,
 * subcontractors, commissions. An expense can hang off a client (and its plan
 * or the specific payment it offsets) so the client's net — cobrado minus
 * gastado — is visible in one place. Reads run as the signed-in user (RLS
 * limits `crm_expenses` to dios/admin/ejecutivo); writes require
 * `requireBillingWrite()`. Types/constants/mapper live in `./expense-types`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireBillingWrite } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory } from "./history";
import { formatCurrencyMXN } from "./format";
import { EXPENSE_CATEGORIES, mapExpense } from "./expense-types";
import type { CrmActionState } from "./clients";

export type { CrmExpense, ExpenseCategory, ExpenseStatus } from "./expense-types";

/** True when a Postgres error is "column ... does not exist" (migration 0033 not applied yet). */
function isMissingStatusColumn(msg: string | undefined) {
  return !!msg && /column .*(status|paid_date).* does not exist/i.test(msg);
}

/**
 * Every expense, most recent first — excluding those tied to a soft-deleted
 * client (general expenses with no client are always kept).
 */
export async function getExpenses() {
  return withTiming("crm.getExpenses", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_expenses")
      .select("*, crm_clients(deleted_at)")
      .is("deleted_at", null)
      .order("expense_date", { ascending: false });
    const rows = (data ?? []) as (Parameters<typeof mapExpense>[0] & {
      crm_clients: { deleted_at: string | null } | { deleted_at: string | null }[] | null;
    })[];
    return rows
      .filter((r) => {
        if (!r.client_id) return true;
        const c = Array.isArray(r.crm_clients) ? r.crm_clients[0] : r.crm_clients;
        return !c || c.deleted_at == null;
      })
      .map(mapExpense);
  });
}

function readExpenseFields(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const categoryRaw = str("category");
  const paid = formData.get("markPaidNow") === "on";
  return {
    clientId: str("clientId") || null,
    planId: str("planId") || null,
    paymentId: str("paymentId") || null,
    category: (EXPENSE_CATEGORIES as readonly string[]).includes(categoryRaw) ? categoryRaw : "otro",
    concept: str("concept"),
    amount: Number(formData.get("amount") ?? 0),
    expenseDate: str("expenseDate"),
    vendor: str("vendor") || null,
    method: str("method") || null,
    notes: str("notes") || null,
    status: (paid ? "pagado" : "pendiente") as "pagado" | "pendiente",
  };
}

/** `useActionState` action backing the "Nuevo egreso" form. */
export async function createExpenseAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const f = readExpenseFields(formData);
  if (!f.concept || !(f.amount > 0)) {
    return { error: "Escribe el concepto y un monto mayor a 0" };
  }

  const supabase = await createClient();
  const base = {
    client_id: f.clientId,
    plan_id: f.planId,
    payment_id: f.paymentId,
    category: f.category,
    concept: f.concept,
    amount: f.amount,
    expense_date: f.expenseDate || undefined,
    vendor: f.vendor,
    method: f.method,
    notes: f.notes,
    created_by: check.userId,
  };
  let { error } = await supabase.from("crm_expenses").insert({
    ...base,
    status: f.status,
    paid_date: f.status === "pagado" ? f.expenseDate || new Date().toISOString().slice(0, 10) : null,
  });
  if (error && isMissingStatusColumn(error.message)) {
    ({ error } = await supabase.from("crm_expenses").insert(base)); // migration 0033 pending
  }
  if (error) return { error: error.message };

  if (f.clientId) {
    await addHistory(
      supabase,
      f.clientId,
      "egreso",
      `Egreso ${f.status === "pagado" ? "" : "programado "}de ${formatCurrencyMXN(f.amount)} — ${f.concept}`,
      check.userId
    );
  }
  revalidatePath("/admin");
  return { success: true };
}

/** Marks a programmed expense as paid today. */
export async function markExpensePaidAction(
  expenseId: string,
  clientId?: string | null
): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_expenses")
    .update({ status: "pagado", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", expenseId)
    .is("deleted_at", null);
  if (error) {
    return {
      error: isMissingStatusColumn(error.message)
        ? "Falta aplicar la migración 0033 para los egresos pendientes."
        : error.message,
    };
  }

  if (clientId) await addHistory(supabase, clientId, "egreso", "Egreso marcado como pagado", check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the inline "Editar egreso" form. */
export async function updateExpenseAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const expenseId = String(formData.get("expenseId") ?? "").trim();
  if (!expenseId) return { error: "Egreso no encontrado" };
  const f = readExpenseFields(formData);
  if (!f.concept || !(f.amount > 0)) {
    return { error: "Escribe el concepto y un monto mayor a 0" };
  }

  const supabase = await createClient();
  const base = {
    category: f.category,
    concept: f.concept,
    amount: f.amount,
    expense_date: f.expenseDate || undefined,
    vendor: f.vendor,
    method: f.method,
  };
  let { error } = await supabase
    .from("crm_expenses")
    .update({
      ...base,
      status: f.status,
      paid_date: f.status === "pagado" ? f.expenseDate || new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", expenseId)
    .is("deleted_at", null);
  if (error && isMissingStatusColumn(error.message)) {
    ({ error } = await supabase.from("crm_expenses").update(base).eq("id", expenseId).is("deleted_at", null));
  }
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes an expense (recoverable; logged to `deletion_log`). */
export async function deleteExpenseAction(expenseId: string, clientId?: string | null): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_expenses",
    id: expenseId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  if (clientId) {
    const supabase = await createClient();
    await addHistory(supabase, clientId, "egreso", "Egreso eliminado", check.userId);
  }
  revalidatePath("/admin");
  return { success: true };
}
