"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClientStatus = "lead" | "negociacion" | "activo" | "inactivo";
export type HistoryEntryType =
  | "nota"
  | "llamada"
  | "reunion"
  | "email"
  | "pago"
  | "plan"
  | "cambio_estado"
  | "otro";
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

export type ClientHistoryEntry = {
  id: string;
  clientId: string;
  entryType: HistoryEntryType;
  description: string;
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

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false as const, error: "No tienes permisos de administrador" };

  return { ok: true as const, userId: user.id };
}

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

function mapHistory(row: {
  id: string;
  client_id: string;
  entry_type: string;
  description: string;
  created_at: string;
}): ClientHistoryEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    entryType: row.entry_type as HistoryEntryType,
    description: row.description,
    createdAt: row.created_at,
  };
}

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

async function addHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  entryType: HistoryEntryType,
  description: string,
  userId: string
) {
  await supabase
    .from("crm_client_history")
    .insert({ client_id: clientId, entry_type: entryType, description, created_by: userId });
}

export async function getClients(): Promise<CrmClient[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("crm_clients").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapClient);
}

export async function getAllPayments(): Promise<ClientPayment[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("crm_payments").select("*").order("due_date", { ascending: true });
  return (data ?? []).map(mapPayment);
}

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

export async function createClientAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireAdmin();
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

export async function updateClientStatusAction(clientId: string, status: ClientStatus): Promise<CrmActionState> {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_clients").update({ status }).eq("id", clientId);
  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "cambio_estado", `Estado actualizado a "${status}"`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

export async function addHistoryEntryAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireAdmin();
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

export async function createPlanAction(_prevState: CrmActionState, formData: FormData): Promise<CrmActionState> {
  const check = await requireAdmin();
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

export async function recordPaymentAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireAdmin();
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

export async function markPaymentPaidAction(paymentId: string, clientId: string): Promise<CrmActionState> {
  const check = await requireAdmin();
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
