"use server";

/**
 * CRM invoicing: data fetching plus server actions for creating invoices
 * (with an auto-generated sequential folio via `insertWithSequentialNumber`)
 * and updating their status. Every write requires `requireBillingWrite()`
 * and logs a matching entry to the associated client's history.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireBillingWrite } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory } from "./history";
import { insertWithSequentialNumber } from "./numbering";
import { formatCurrencyMXN } from "./format";
import type { CrmActionState } from "./clients";

export type InvoiceStatus = "borrador" | "enviada" | "pagada" | "vencida";

export type CrmInvoice = {
  id: string;
  clientId: string;
  projectId: string | null;
  number: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  notes: string | null;
  createdAt: string;
};

/** Converts a raw `crm_invoices` row (snake_case) into a `CrmInvoice`. */
function mapInvoice(row: {
  id: string;
  client_id: string;
  project_id: string | null;
  number: string;
  amount: number;
  status: string;
  issued_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
}): CrmInvoice {
  return {
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id,
    number: row.number,
    amount: Number(row.amount),
    status: row.status as InvoiceStatus,
    issuedDate: row.issued_date,
    dueDate: row.due_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Fetches every invoice, ordered by due date ascending. */
export async function getInvoices(): Promise<CrmInvoice[]> {
  return withTiming("crm.getInvoices", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_invoices").select("*").is("deleted_at", null).order("due_date", { ascending: true });
    return (data ?? []).map(mapInvoice);
  });
}

/** `useActionState` action backing the "Nueva factura" form; assigns the next sequential folio. */
export async function createInvoiceAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const projectId = String(formData.get("projectId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!clientId || !dueDate || !amount) {
    return { error: "Selecciona un cliente y completa el monto y la fecha de vencimiento" };
  }

  const supabase = await createClient();
  const result = await insertWithSequentialNumber(supabase, "crm_invoices", "TP", {
    client_id: clientId,
    project_id: projectId || null,
    amount,
    due_date: dueDate,
    created_by: check.userId,
  });

  if ("error" in result) return { error: result.error };

  await addHistory(
    supabase,
    clientId,
    "factura",
    `Factura ${result.number} creada por ${formatCurrencyMXN(amount)}`,
    check.userId
  );
  revalidatePath("/admin");
  return { success: true };
}

/** Updates an invoice's status (e.g. to "pagada") and logs the change to the client's history. */
export async function updateInvoiceStatusAction(
  invoiceId: string,
  clientId: string,
  status: InvoiceStatus
): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_invoices").update({ status }).eq("id", invoiceId);
  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "factura", `Factura actualizada a "${status}"`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes an invoice (recoverable; logged to `deletion_log`). */
export async function deleteInvoiceAction(invoiceId: string, clientId?: string): Promise<CrmActionState> {
  const check = await requireBillingWrite();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_invoices",
    id: invoiceId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  if (clientId) {
    const supabase = await createClient();
    await addHistory(supabase, clientId, "factura", "Factura eliminada", check.userId);
  }
  revalidatePath("/admin");
  return { success: true };
}
