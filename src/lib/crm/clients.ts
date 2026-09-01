"use server";

/**
 * Core CRM entity: clients, their recurring billing plans, and their
 * payments. Exports both the data-fetching functions used to hydrate the
 * admin dashboard and the server actions (create client, update status, add
 * a plan, record/mark payments) invoked from the CRM UI. Every mutation here
 * requires `requireCrmCore()` (dios, admin, or ejecutivo) and logs a
 * corresponding entry to the client's history via `addHistory`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmCore } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory, mapHistory, type ClientHistoryEntry, type HistoryEntryType } from "./history";
import { getContactsByClient, type CrmContact } from "./contacts";

export type { HistoryEntryType, ClientHistoryEntry } from "./history";
export type { CrmContact } from "./contacts";

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

/**
 * Tax + billing profile for a client (CFDI 4.0 receptor fields plus a
 * postal address for invoice PDFs). Lives on the same `crm_clients` row but
 * is only loaded for the client detail view, never the list, and is filled
 * in from its own panel once a lead becomes a paying client.
 */
export type ClientBilling = {
  taxName: string | null;
  rfc: string | null;
  taxRegime: string | null;
  cfdiUse: string | null;
  taxZip: string | null;
  billingEmail: string | null;
  paymentForm: string | null;
  paymentMethod: "PUE" | "PPD" | null;
  paymentTermsDays: number | null;
  currency: string;
  addressStreet: string | null;
  addressExt: string | null;
  addressInt: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressCountry: string;
  website: string | null;
};

/**
 * General (non-fiscal) profile fields for a client — contact's job title,
 * industry, lead source, company size, WhatsApp, city and a reference
 * address. All optional; edited from the same client form as name/company.
 */
export type ClientProfile = {
  jobTitle: string | null;
  industry: string | null;
  source: string | null;
  companySize: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
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
  billing: ClientBilling;
  profile: ClientProfile;
  contacts: CrmContact[];
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

/** Pulls the tax/billing columns off a raw `crm_clients` row into a `ClientBilling`. */
function mapBilling(row: {
  tax_name: string | null;
  rfc: string | null;
  tax_regime: string | null;
  cfdi_use: string | null;
  tax_zip: string | null;
  billing_email: string | null;
  payment_form: string | null;
  payment_method: string | null;
  payment_terms_days: number | null;
  currency: string | null;
  address_street: string | null;
  address_ext: string | null;
  address_int: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  website: string | null;
}): ClientBilling {
  return {
    taxName: row.tax_name,
    rfc: row.rfc,
    taxRegime: row.tax_regime,
    cfdiUse: row.cfdi_use,
    taxZip: row.tax_zip,
    billingEmail: row.billing_email,
    paymentForm: row.payment_form,
    paymentMethod: (row.payment_method as "PUE" | "PPD" | null) ?? null,
    paymentTermsDays: row.payment_terms_days,
    currency: row.currency ?? "MXN",
    addressStreet: row.address_street,
    addressExt: row.address_ext,
    addressInt: row.address_int,
    addressNeighborhood: row.address_neighborhood,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressCountry: row.address_country ?? "México",
    website: row.website,
  };
}

/** Pulls the general (non-fiscal) profile columns off a raw `crm_clients` row. */
function mapProfile(row: {
  job_title: string | null;
  industry: string | null;
  source: string | null;
  company_size: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
}): ClientProfile {
  return {
    jobTitle: row.job_title,
    industry: row.industry,
    source: row.source,
    companySize: row.company_size,
    whatsapp: row.whatsapp,
    city: row.city,
    address: row.address,
  };
}

/** Snake-case `crm_clients` columns for the optional profile fields on the client form. */
function profileColumns(formData: FormData) {
  const val = (k: string) => String(formData.get(k) ?? "").trim() || null;
  return {
    job_title: val("jobTitle"),
    industry: val("industry"),
    source: val("source"),
    company_size: val("companySize"),
    whatsapp: val("whatsapp"),
    city: val("city"),
    address: val("address"),
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
    const { data } = await supabase
      .from("crm_clients")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
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

  const [{ data: client }, contacts, { data: history }, { data: plans }, { data: payments }] =
    await Promise.all([
      supabase.from("crm_clients").select("*").eq("id", clientId).single(),
      getContactsByClient(clientId),
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
    billing: mapBilling(client),
    profile: mapProfile(client),
    contacts,
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
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

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
      notes: notes || null,
      ...profileColumns(formData),
      created_by: check.userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "No se pudo crear el cliente" };

  await addHistory(supabase, data.id, "otro", "Cliente creado", check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the "Editar cliente" form on the client detail modal. */
export async function updateClientAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientId) return { error: "Cliente no encontrado" };
  if (!name || !company) {
    return { error: "Nombre y empresa son obligatorios" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_clients")
    .update({
      name,
      company,
      email: email || null,
      phone: phone || null,
      service: service || null,
      notes: notes || null,
      ...profileColumns(formData),
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "otro", "Datos del cliente actualizados", check.userId);
  revalidatePath("/admin");
  return { success: true };
}

const RFC_RE = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{2,3}$/i;

/**
 * `useActionState` action backing the "Datos fiscales y facturación" panel.
 * All fields are optional; RFC and CP are format-checked only when present so
 * a half-filled profile can still be saved.
 */
export async function updateClientBillingAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "Cliente no encontrado" };

  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const rfc = str("rfc").toUpperCase();
  const taxZip = str("taxZip");
  const paymentMethod = str("paymentMethod");
  const termsRaw = str("paymentTermsDays");

  if (rfc && !RFC_RE.test(rfc)) return { error: "El RFC no tiene un formato válido" };
  if (taxZip && !/^\d{5}$/.test(taxZip)) return { error: "El código postal debe tener 5 dígitos" };
  if (paymentMethod && paymentMethod !== "PUE" && paymentMethod !== "PPD") {
    return { error: "Método de pago inválido" };
  }
  const paymentTermsDays = termsRaw ? Number(termsRaw) : null;
  if (paymentTermsDays !== null && (!Number.isInteger(paymentTermsDays) || paymentTermsDays < 0)) {
    return { error: "Los días de crédito deben ser un entero mayor o igual a 0" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_clients")
    .update({
      tax_name: str("taxName") || null,
      rfc: rfc || null,
      tax_regime: str("taxRegime") || null,
      cfdi_use: str("cfdiUse") || null,
      tax_zip: taxZip || null,
      billing_email: str("billingEmail") || null,
      payment_form: str("paymentForm") || null,
      payment_method: paymentMethod || null,
      payment_terms_days: paymentTermsDays,
      currency: str("currency") || "MXN",
      address_street: str("addressStreet") || null,
      address_ext: str("addressExt") || null,
      address_int: str("addressInt") || null,
      address_neighborhood: str("addressNeighborhood") || null,
      address_city: str("addressCity") || null,
      address_state: str("addressState") || null,
      address_country: str("addressCountry") || "México",
      website: str("website") || null,
    })
    .eq("id", clientId);

  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "otro", "Datos fiscales y de facturación actualizados", check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** Updates a client's lifecycle status and logs the change to their history. */
export async function updateClientStatusAction(clientId: string, status: ClientStatus): Promise<CrmActionState> {
  const check = await requireCrmCore();
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
  const check = await requireCrmCore();
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
  const check = await requireCrmCore();
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
  const check = await requireCrmCore();
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
  const check = await requireCrmCore();
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

/** Soft-deletes a client (recoverable; logged to `deletion_log`). */
export async function deleteClientAction(clientId: string): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  await addHistory(supabase, clientId, "otro", "Cliente eliminado", check.userId);

  const result = await softDelete({
    table: "crm_clients",
    id: clientId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}
