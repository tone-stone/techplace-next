/**
 * Pure types + constants + row mapper for IT assets. Kept out of
 * `assets.ts` because that file is `"use server"` and may only export async
 * functions — the enums/labels and `mapAsset` live here so both the server
 * actions and the client `AssetsSection` can import them.
 */

export type AssetType =
  | "computo"
  | "servidor"
  | "router"
  | "switch"
  | "firewall"
  | "access_point"
  | "impresora"
  | "telefonia"
  | "dominio"
  | "sitio_web"
  | "licencia"
  | "otro";

export type AssetStatus = "activo" | "en_reparacion" | "retirado";

export const ASSET_TYPES: AssetType[] = [
  "computo",
  "servidor",
  "router",
  "switch",
  "firewall",
  "access_point",
  "impresora",
  "telefonia",
  "dominio",
  "sitio_web",
  "licencia",
  "otro",
];

export const ASSET_STATUSES: AssetStatus[] = ["activo", "en_reparacion", "retirado"];

export type ItAsset = {
  id: string;
  clientId: string;
  name: string;
  assetType: AssetType;
  status: AssetStatus;
  identifier: string | null;
  location: string | null;
  ipAddress: string | null;
  vendor: string | null;
  notes: string | null;
  acquiredOn: string | null;
  warrantyUntil: string | null;
  createdAt: string;
};

/** Converts a raw `it_assets` row (snake_case) into an `ItAsset`. */
export function mapAsset(row: {
  id: string;
  client_id: string;
  name: string;
  asset_type: string;
  status: string;
  identifier: string | null;
  location: string | null;
  ip_address: string | null;
  vendor: string | null;
  notes: string | null;
  acquired_on: string | null;
  warranty_until: string | null;
  created_at: string;
}): ItAsset {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    assetType: row.asset_type as AssetType,
    status: row.status as AssetStatus,
    identifier: row.identifier,
    location: row.location,
    ipAddress: row.ip_address,
    vendor: row.vendor,
    notes: row.notes,
    acquiredOn: row.acquired_on,
    warrantyUntil: row.warranty_until,
    createdAt: row.created_at,
  };
}
