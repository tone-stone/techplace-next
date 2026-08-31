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
import {
  CONTRACT_STATUSES,
  mapContract,
  mapContractService,
  type BillingCycle,
  type ContractDetail,
  type ContractStatus,
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
    billingCycle: BILLING_CYCLES.includes(cycleRaw as BillingCycle) ? (cycleRaw as BillingCycle) : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
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
