"use server";

/**
 * Client contracts: title, status, term, included hours / SLA, recurring
 * billing, plus the catalog-service lines that make it up. Types/mappers live
 * in `./contract-types`. Mutations gated by `requireCrmCore()`
 * (dios / admin / ejecutivo).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmCore } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory } from "./history";
import {
  CONTRACT_STATUSES,
  SERVICE_UNITS,
  mapContract,
  mapContractService,
  type BillingCycle,
  type ContractDetail,
  type ContractStatus,
  type ServiceUnit,
} from "./contract-types";
import type { CrmActionState } from "./clients";

export type {
  CrmContract,
  ContractServiceLine,
  ContractDetail,
  ContractStatus,
} from "./contract-types";

const BILLING_CYCLES: BillingCycle[] = ["mensual", "trimestral", "anual"];

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Every live contract, newest first. */
export async function getContracts() {
  return withTiming("crm.getContracts", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_contracts")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapContract);
  });
}

/** One contract with its service lines. */
export async function getContractDetail(contractId: string): Promise<ContractDetail | null> {
  const supabase = await createClient();
  const [{ data: contract }, { data: lines }] = await Promise.all([
    supabase.from("crm_contracts").select("*").eq("id", contractId).is("deleted_at", null).maybeSingle(),
    supabase.from("crm_contract_services").select("*").eq("contract_id", contractId).order("created_at", { ascending: true }),
  ]);
  if (!contract) return null;
  return {
    contract: mapContract(contract),
    services: (lines ?? []).map(mapContractService),
  };
}

function readContractForm(formData: FormData) {
  const statusRaw = String(formData.get("status") ?? "borrador").trim();
  const cycleRaw = String(formData.get("billingCycle") ?? "").trim();
  const typeRaw = String(formData.get("serviceType") ?? "").trim();
  const billingCycle = BILLING_CYCLES.includes(cycleRaw as BillingCycle) ? (cycleRaw as BillingCycle) : null;
  return {
    clientId: String(formData.get("clientId") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    status: CONTRACT_STATUSES.includes(statusRaw as ContractStatus)
      ? (statusRaw as ContractStatus)
      : "borrador",
    startDate: String(formData.get("startDate") ?? "").trim() || null,
    endDate: String(formData.get("endDate") ?? "").trim() || null,
    includedHours: numOrNull(formData.get("includedHours")),
    slaHours: numOrNull(formData.get("slaHours")),
    billingAmount: numOrNull(formData.get("billingAmount")),
    billingCycle,
    notes: String(formData.get("notes") ?? "").trim() || null,
    /** "Tipo de servicio" para el catálogo; si no llega, se infiere del ciclo. */
    serviceType: SERVICE_UNITS.includes(typeRaw as ServiceUnit)
      ? (typeRaw as ServiceUnit)
      : billingCycle
        ? "mes"
        : "proyecto",
  };
}

/**
 * Ensures the service catalog (`crm_services`) has an entry for `name`, so a
 * service contracted from the Servicios tab becomes reusable. No-op if a
 * non-deleted catalog row with the same name (case-insensitive) already exists.
 */
async function ensureCatalogService(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: { name: string; unit: ServiceUnit; defaultRate: number | null; description: string | null; userId: string }
): Promise<void> {
  const escaped = opts.name.replace(/[%_\\]/g, "\\$&");
  const { data: existing } = await supabase
    .from("crm_services")
    .select("id")
    .ilike("name", escaped)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return;

  await supabase.from("crm_services").insert({
    name: opts.name,
    description: opts.description,
    unit: opts.unit,
    default_rate: opts.defaultRate ?? 0,
    created_by: opts.userId,
  });
}

export async function createContractAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const f = readContractForm(formData);
  if (!f.clientId || !f.title) return { error: "Selecciona un cliente y escribe el título del contrato" };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_contracts").insert({
    client_id: f.clientId,
    title: f.title,
    status: f.status,
    start_date: f.startDate,
    end_date: f.endDate,
    included_hours: f.includedHours,
    sla_hours: f.slaHours == null ? null : Math.round(f.slaHours),
    billing_amount: f.billingAmount,
    billing_cycle: f.billingCycle,
    notes: f.notes,
    created_by: check.userId,
  });
  if (error) return { error: error.message };

  // Mirror the new service into the catalog (with its tipo de servicio), so it
  // can be reused as a contract line elsewhere. Best-effort: a catalog failure
  // doesn't fail the contract creation.
  await ensureCatalogService(supabase, {
    name: f.title,
    unit: f.serviceType,
    defaultRate: f.billingAmount,
    description: f.notes,
    userId: check.userId,
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Assigns a catalog service to a client from the Servicios → Catálogo tab:
 * creates a `crm_contracts` row (title/amount/cycle taken from the service)
 * plus a `crm_contract_services` line linking them, and — when the client is
 * new — creates the client first. This is the "cliente y servicios van
 * ligados" flow.
 */
export async function assignServiceToClientAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const serviceId = String(formData.get("serviceId") ?? "").trim();
  let clientId = String(formData.get("clientId") ?? "").trim();
  if (clientId === "__new__") clientId = "";
  const newCompany = String(formData.get("newClientCompany") ?? "").trim();
  const newName = String(formData.get("newClientName") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "activo").trim();
  const status = CONTRACT_STATUSES.includes(statusRaw as ContractStatus)
    ? (statusRaw as ContractStatus)
    : "activo";

  if (!serviceId) return { error: "Falta el servicio" };
  if (!clientId && !newCompany) {
    return { error: "Elige un cliente o escribe el nombre de uno nuevo" };
  }

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("crm_services")
    .select("name, description, unit, default_rate")
    .eq("id", serviceId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!service) return { error: "No se encontró el servicio en el catálogo" };

  if (!clientId) {
    const { data: created, error: clientErr } = await supabase
      .from("crm_clients")
      .insert({ name: newName || newCompany, company: newCompany, status: "activo", created_by: check.userId })
      .select("id")
      .single();
    if (clientErr || !created) return { error: clientErr?.message ?? "No se pudo crear el cliente" };
    clientId = created.id;
    await addHistory(supabase, clientId, "otro", "Cliente creado", check.userId);
  }

  const rate = Number(service.default_rate) || 0;
  const { data: contract, error: contractErr } = await supabase
    .from("crm_contracts")
    .insert({
      client_id: clientId,
      title: service.name,
      status,
      billing_amount: rate || null,
      billing_cycle: service.unit === "mes" ? "mensual" : null,
      notes: service.description,
      created_by: check.userId,
    })
    .select("id")
    .single();
  if (contractErr || !contract) return { error: contractErr?.message ?? "No se pudo crear el servicio del cliente" };

  const { error: lineErr } = await supabase.from("crm_contract_services").insert({
    contract_id: contract.id,
    service_id: serviceId,
    quantity: 1,
    rate: rate || null,
  });
  if (lineErr) return { error: lineErr.message };

  await addHistory(supabase, clientId, "otro", `Servicio "${service.name}" contratado`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

export async function updateContractAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const contractId = String(formData.get("contractId") ?? "").trim();
  const f = readContractForm(formData);
  if (!contractId || !f.title) return { error: "El título del contrato es obligatorio" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_contracts")
    .update({
      title: f.title,
      status: f.status,
      start_date: f.startDate,
      end_date: f.endDate,
      included_hours: f.includedHours,
      sla_hours: f.slaHours == null ? null : Math.round(f.slaHours),
      billing_amount: f.billingAmount,
      billing_cycle: f.billingCycle,
      notes: f.notes,
    })
    .eq("id", contractId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteContractAction(contractId: string): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_contracts",
    id: contractId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}

/** Adds a catalog service line to a contract. */
export async function addContractServiceAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const contractId = String(formData.get("contractId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const rate = numOrNull(formData.get("rate"));

  if (!contractId || !serviceId) return { error: "Selecciona un servicio" };
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "La cantidad debe ser mayor a 0" };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_contract_services").insert({
    contract_id: contractId,
    service_id: serviceId,
    quantity,
    rate,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Removes a contract service line (hard delete — it's a join row). */
export async function removeContractServiceAction(lineId: string): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_contract_services").delete().eq("id", lineId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
