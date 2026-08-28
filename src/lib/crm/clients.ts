"use server";

/**
 * Core CRM entity: clients, their recurring billing plans, and their
 * payments. Exports both the data-fetching functions used to hydrate the
 * admin dashboard and the server actions (create client, update status, add
 * a plan, record/mark payments) invoked from the CRM UI. Every mutation here
 * requires `requireCrmAccess()` (admin or operativo) and logs a
 * corresponding entry to the client's history via `addHistory`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmAccess } from "./auth";
import { addHistory, mapHistory, type ClientHistoryEntry, type HistoryEntryType } from "./history";

export type { HistoryEntryType, ClientHistoryEntry } from "./history";

export type ClientStatus = "lead" | "negociacion" | "activo" | "inactivo";
export type PlanStatus = "activo" | "pausado" | "cancelado";
export type BillingCycle = "mensual" | "trimestral" | "anual";
export type PaymentStatus = "pendiente" | "pagado" | "vencido";

export type CrmClient = {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  service: string | null;
  notes: string | null;
  createdAt: string;
};

export type ClientPlan = {
  id: string;
  clientId: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  cutoffDay: number;
  nextDueDate: string;
  status: PlanStatus;
};

export type ClientPayment = {
  id: string;
  clientId: string;
  planId: string | null;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
  notes: string | null;
  createdAt: string;
};

export type ClientDetail = {
  client: CrmClient;
  history: ClientHistoryEntry[];
  plans: ClientPlan[];
  payments: ClientPayment[];
};

export type CrmActionState = { error: string } | { success: true } | null;

/** Converts a raw `crm_clients` row (snake_case) into a `CrmClient`. */
function mapClient(row: {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  status: string;
  service: string | null;
  notes: string | null;
  created_at: string;
}): CrmClient {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    status: row.status as ClientStatus,
    service: row.service,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Converts a raw `crm_plans` row (snake_case) into a `ClientPlan`. */
function mapPlan(row: {
  id: string;
  client_id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  cutoff_day: number;
  next_due_date: string;
  status: string;
}): ClientPlan {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    amount: Number(row.amount),
    billingCycle: row.billing_cycle as BillingCycle,
    cutoffDay: row.cutoff_day,
    nextDueDate: row.next_due_date,
    status: row.status as PlanStatus,
  };
}

/** Converts a raw `crm_payments` row (snake_case) into a `ClientPayment`. */
function mapPayment(row: {
  id: string;
  client_id: string;
  plan_id: string | null;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  method: string | null;
  notes: string | null;
  created_at: string;
}): ClientPayment {
  return {
    id: row.id,
    clientId: row.client_id,
    planId: row.plan_id,
    amount: Number(row.amount),
    status: row.status as PaymentStatus,
    dueDate: row.due_date,
    paidDate: row.paid_date,
    method: row.method,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Fetches every CRM client, most recently created first. */
export async function getClients(): Promise<CrmClient[]> {
  return withTiming("crm.getClients", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_clients").select("*").order("created_at", { ascending: false });
    return (data ?? []).map(mapClient);
  });
}

/** Fetches every payment across all clients, ordered by due date. */
export async function getAllPayments(): Promise<ClientPayment[]> {
  return withTiming("crm.getAllPayments", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_payments").select("*").order("due_date", { ascending: true });
    return (data ?? []).map(mapPayment);
  });
}

/**
 * Fetches a single client's full profile (client, history, plans, payments)
 * for the client detail modal, in parallel.
 *
 * @returns `null` if no client matches `clientId`.
 */
export async function getClientDetail(clientId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();

  const [{ data: client }, { data: history }, { data: plans }, { data: payments }] = await Promise.all([
    supabase.from("crm_clients").select("*").eq("id", clientId).single(),
    supabase
      .from("crm_client_history")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("crm_plans").select("*").eq("client_id", clientId).order("next_due_date", { ascending: true }),
    supabase.from("crm_payments").select("*").eq("client_id", clientId).order("due_date", { ascending: false }),
  ]);

  if (!client) return null;

  return {
    client: mapClient(client),
    history: (history ?? []).map(mapHistory),
    plans: (plans ?? []).map(mapPlan),
    payments: (payments ?? []).map(mapPayment),
  };
}

/** `useActionState` action backing the "Nuevo cliente" form. */
export async function createClientAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();

  if (!name || !company) {
    return { error: "Nombre y empresa son obligatorios" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_clients")
    .insert({
      name,
      company,
      email: email || null,
      phone: phone || null,
      service: service || null,
      created_by: check.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el cliente" };

  await addHistory(supabase, data.id, "otro", "Cliente creado", check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** Updates a client's lifecycle status and logs the change to their history. */
export async function updateClientStatusAction(clientId: string, status: ClientStatus): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_clients").update({ status }).eq("id", clientId);
  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "cambio_estado", `Estado actualizado a "${status}"`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the manual "add a note" form on the client detail modal. */
export async function addHistoryEntryAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const entryType = String(formData.get("entryType") ?? "nota") as HistoryEntryType;
  const description = String(formData.get("description") ?? "").trim();

  if (!clientId || !description) {
    return { error: "Escribe una descripción para la nota" };
  }

  const supabase = await createClient();
  await addHistory(supabase, clientId, entryType, description, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the "Nuevo plan" form on the client detail modal. */
export async function createPlanAction(_prevState: CrmActionState, formData: FormData): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const billingCycle = String(formData.get("billingCycle") ?? "mensual") as BillingCycle;
  const cutoffDay = Number(formData.get("cutoffDay") ?? 1);
  const nextDueDate = String(formData.get("nextDueDate") ?? "");

  if (!clientId || !name || !nextDueDate || !amount) {
    return { error: "Completa nombre, monto y fecha de vencimiento del plan" };
  }
  if (cutoffDay < 1 || cutoffDay > 31) {
    return { error: "El día de corte debe estar entre 1 y 31" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_plans").insert({
    client_id: clientId,
    name,
    amount,
    billing_cycle: billingCycle,
    cutoff_day: cutoffDay,
    next_due_date: nextDueDate,
  });

  if (error) return { error: error.message };

  await addHistory(
    supabase,
    clientId,
    "plan",
    `Plan "${name}" creado — corte día ${cutoffDay}, vence ${nextDueDate}`,
    check.userId
  );
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the "Nuevo pago" form; can insert as already-paid via `markPaidNow`. */
export async function recordPaymentAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const planId = String(formData.get("planId") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dueDate = String(formData.get("dueDate") ?? "");
  const method = String(formData.get("method") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const markPaidNow = formData.get("markPaidNow") === "on";

  if (!clientId || !dueDate || !amount) {
    return { error: "Completa el monto y la fecha de vencimiento del pago" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_payments").insert({
    client_id: clientId,
    plan_id: planId || null,
    amount,
    due_date: dueDate,
    method: method || null,
    notes: notes || null,
    status: markPaidNow ? "pagado" : "pendiente",
    paid_date: markPaidNow ? new Date().toISOString().slice(0, 10) : null,
  });

  if (error) return { error: error.message };

  await addHistory(
    supabase,
    clientId,
    "pago",
    markPaidNow
      ? `Pago de $${amount.toLocaleString("es-MX")} registrado como pagado`
      : `Pago de $${amount.toLocaleString("es-MX")} programado para ${dueDate}`,
    check.userId
  );
  revalidatePath("/admin");
  return { success: true };
}

/** Marks an existing payment as paid today (used by the "Marcar pagado" button). */
export async function markPaymentPaidAction(paymentId: string, clientId: string): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("crm_payments")
    .update({ status: "pagado", paid_date: today })
    .eq("id", paymentId);

  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "pago", "Pago marcado como pagado", check.userId);
  revalidatePath("/admin");
  return { success: true };
}
