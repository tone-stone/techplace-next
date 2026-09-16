"use server";

/**
 * IT Asset Management server layer: the hardware, network gear, domains and
 * licenses a client owns, tracked per `crm_clients` account. Types, enums and
 * the row mapper live in `./asset-types` (a `"use server"` file may only
 * export async functions). Mutations are gated by `requireSupport()` (dios /
 * admin / ejecutivo); soft-delete goes through the shared `softDelete` helper.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireSupport } from "@/lib/crm/auth";
import { softDelete } from "@/lib/crm/soft-delete";
import type { CrmActionState } from "@/lib/crm/clients";
import {
  ASSET_STATUSES,
  ASSET_TYPES,
  mapAsset,
  type AssetStatus,
  type AssetType,
  type ItAsset,
} from "./asset-types";

export type { AssetStatus, AssetType, ItAsset } from "./asset-types";

/** Every live asset across all clients, newest first. */
export async function getAssets(): Promise<ItAsset[]> {
  return withTiming("it.getAssets", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("it_assets")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapAsset);
  });
}

/** A single client's live assets, newest first. */
export async function getAssetsByClient(clientId: string): Promise<ItAsset[]> {
  return withTiming("it.getAssetsByClient", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("it_assets")
      .select("*")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapAsset);
  });
}

function readAssetForm(formData: FormData) {
  const pick = (k: string) => String(formData.get(k) ?? "").trim();
  const assetTypeRaw = pick("assetType");
  const statusRaw = pick("status");
  return {
    clientId: pick("clientId"),
    name: pick("name"),
    assetType: ASSET_TYPES.includes(assetTypeRaw as AssetType) ? (assetTypeRaw as AssetType) : "otro",
    status: ASSET_STATUSES.includes(statusRaw as AssetStatus) ? (statusRaw as AssetStatus) : "activo",
    identifier: pick("identifier"),
    location: pick("location"),
    ipAddress: pick("ipAddress"),
    vendor: pick("vendor"),
    notes: pick("notes"),
    acquiredOn: pick("acquiredOn"),
    warrantyUntil: pick("warrantyUntil"),
  };
}

/** `useActionState` action backing the "Nuevo activo" form. */
export async function createAssetAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const f = readAssetForm(formData);
  if (!f.clientId || !f.name) {
    return { error: "Selecciona un cliente y escribe el nombre del activo" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("it_assets").insert({
    client_id: f.clientId,
    name: f.name,
    asset_type: f.assetType,
    status: f.status,
    identifier: f.identifier || null,
    location: f.location || null,
    ip_address: f.ipAddress || null,
    vendor: f.vendor || null,
    notes: f.notes || null,
    acquired_on: f.acquiredOn || null,
    warranty_until: f.warrantyUntil || null,
    created_by: check.userId,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the inline "edit asset" form. */
export async function updateAssetAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const assetId = String(formData.get("assetId") ?? "").trim();
  const f = readAssetForm(formData);
  if (!assetId || !f.name) return { error: "El nombre del activo es obligatorio" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("it_assets")
    .update({
      name: f.name,
      asset_type: f.assetType,
      status: f.status,
      identifier: f.identifier || null,
      location: f.location || null,
      ip_address: f.ipAddress || null,
      vendor: f.vendor || null,
      notes: f.notes || null,
      acquired_on: f.acquiredOn || null,
      warranty_until: f.warrantyUntil || null,
    })
    .eq("id", assetId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes an asset (recoverable; logged to `deletion_log`). */
export async function deleteAssetAction(assetId: string): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "it_assets",
    id: assetId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}
