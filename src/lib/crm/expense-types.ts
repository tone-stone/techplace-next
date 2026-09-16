/**
 * Pure types + constants + mapper for CRM expenses (egresos). Kept out of
 * `expenses.ts` because a `"use server"` file may only export async functions.
 */

export const EXPENSE_CATEGORIES = [
  "hosting",
  "dominio",
  "herramientas",
  "subcontratacion",
  "comisiones",
  "publicidad",
  "otro",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseStatus = "pendiente" | "pagado";

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  hosting: "Hosting",
  dominio: "Dominio",
  herramientas: "Herramientas / SaaS",
  subcontratacion: "Subcontratación",
  comisiones: "Comisiones",
  publicidad: "Publicidad",
  otro: "Otro",
};

export type CrmExpense = {
  id: string;
  clientId: string | null;
  planId: string | null;
  paymentId: string | null;
  category: string;
  concept: string;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  method: string | null;
  notes: string | null;
  /** "pendiente" = programado, aún no pagado; no cuenta en las cuentas generales. */
  status: ExpenseStatus;
  paidDate: string | null;
  createdAt: string;
};

/** Converts a raw `crm_expenses` row (snake_case) into a `CrmExpense`. */
export function mapExpense(row: {
  id: string;
  client_id: string | null;
  plan_id: string | null;
  payment_id: string | null;
  category: string;
  concept: string;
  amount: number;
  expense_date: string;
  vendor: string | null;
  method: string | null;
  notes: string | null;
  status?: string | null;
  paid_date?: string | null;
  created_at: string;
}): CrmExpense {
  return {
    id: row.id,
    clientId: row.client_id,
    planId: row.plan_id,
    paymentId: row.payment_id,
    category: row.category,
    concept: row.concept,
    amount: Number(row.amount),
    expenseDate: row.expense_date,
    vendor: row.vendor,
    method: row.method,
    notes: row.notes,
    status: row.status === "pendiente" ? "pendiente" : "pagado",
    paidDate: row.paid_date ?? null,
    createdAt: row.created_at,
  };
}
