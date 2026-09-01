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

export type { CrmExpense, ExpenseCategory } from "./expense-types";

/** Every expense, most recent first. */
export async function getExpenses() {
  return withTiming("crm.getExpenses", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_expenses")
      .select("*")
      .is("deleted_at", null)
      .order("expense_date", { ascending: false });
    return (data ?? []).map(mapExpense);
  });
}

function readExpenseFields(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const categoryRaw = str("category");
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
  const { error } = await supabase.from("crm_expenses").insert({
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
  });
  if (error) return { error: error.message };

  if (f.clientId) {
    await addHistory(
      supabase,
      f.clientId,
      "egreso",
      `Egreso de ${formatCurrencyMXN(f.amount)} — ${f.concept}`,
      check.userId
    );
  }
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
