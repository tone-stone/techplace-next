"use server";

/**
 * Service catalog: the list of things the company sells (support by the hour,
 * a monthly retainer, a fixed project…). Org-wide, not per-client. Contract
 * lines reference these. Types/mappers live in `./contract-types`. Mutations
 * are gated by `requireCrmCore()` (dios / admin / ejecutivo).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmCore } from "./auth";
import { softDelete } from "./soft-delete";
import { SERVICE_UNITS, mapService, type ServiceUnit } from "./contract-types";
import type { CrmActionState } from "./clients";

export type { CrmService } from "./contract-types";

/** Every non-deleted catalog service, active first then oldest→newest (new ones land at the bottom). */
export async function getServices() {
  return withTiming("crm.getServices", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_services")
      .select("*")
      .is("deleted_at", null)
      .order("active", { ascending: false })
      .order("created_at", { ascending: true });
    return (data ?? []).map(mapService);
  });
}

export async function createServiceAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "hora").trim();
  const unit = SERVICE_UNITS.includes(unitRaw as ServiceUnit) ? (unitRaw as ServiceUnit) : "hora";
  const defaultRate = Number(formData.get("defaultRate") ?? 0);

  if (!name) return { error: "Escribe el nombre del servicio" };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_services").insert({
    name,
    description: description || null,
    unit,
    default_rate: Number.isFinite(defaultRate) && defaultRate >= 0 ? defaultRate : 0,
    created_by: check.userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function updateServiceAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "hora").trim();
  const unit = SERVICE_UNITS.includes(unitRaw as ServiceUnit) ? (unitRaw as ServiceUnit) : "hora";
  const defaultRate = Number(formData.get("defaultRate") ?? 0);
  const active = formData.get("active") === "on";

  if (!serviceId || !name) return { error: "El nombre del servicio es obligatorio" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_services")
    .update({
      name,
      description: description || null,
      unit,
      default_rate: Number.isFinite(defaultRate) && defaultRate >= 0 ? defaultRate : 0,
      active,
    })
    .eq("id", serviceId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes a catalog service. `on delete restrict` on contract lines
 *  means a service in use can't be hard-deleted anyway — this hides it. */
export async function deleteServiceAction(serviceId: string): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_services",
    id: serviceId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}
