"use client";

/**
 * "Activos" tab: the IT asset inventory. A searchable/filterable list (by
 * client and by type) with an inline "Nuevo activo" form, per-row edit, and
 * soft-delete. Same shape as `ClientsSection` — plain data props in, server
 * actions from `src/lib/it/assets.ts` out.
 */

import { useActionState, useMemo, useState } from "react";
import { Plus, Search, Server, Trash2, X } from "lucide-react";
import { createAssetAction, deleteAssetAction, updateAssetAction } from "@/lib/it/assets";
import {
  ASSET_STATUSES,
  ASSET_TYPES,
  type AssetStatus,
  type AssetType,
  type ItAsset,
} from "@/lib/it/asset-types";
import type { CrmActionState } from "@/lib/crm/clients";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const TYPE_LABELS: Record<AssetType, string> = {
  computo: "Cómputo",
  servidor: "Servidor",
  router: "Router",
  switch: "Switch",
  firewall: "Firewall",
  access_point: "Access Point",
  impresora: "Impresora",
  telefonia: "Telefonía",
  dominio: "Dominio",
  sitio_web: "Sitio web",
  licencia: "Licencia",
  otro: "Otro",
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  activo: "Activo",
  en_reparacion: "En reparación",
  retirado: "Retirado",
};

const STATUS_CLASS: Record<AssetStatus, string> = {
  activo: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  en_reparacion: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  retirado: "border-white/15 bg-white/5 text-gray-400",
};

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

export default function AssetsSection({
  assets,
  clients,
}: {
  assets: ItAsset[];
  clients: { id: string; name: string }[];
}) {
  const [clientFilter, setClientFilter] = useState<string>("todos");
  const [typeFilter, setTypeFilter] = useState<AssetType | "todos">("todos");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ItAsset | null>(null);

  const companyOf = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (clientFilter !== "todos" && a.clientId !== clientFilter) return false;
      if (typeFilter !== "todos" && a.assetType !== typeFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        (a.identifier ?? "").toLowerCase().includes(q) ||
        (a.ipAddress ?? "").toLowerCase().includes(q) ||
        companyOf(a.clientId).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, clientFilter, typeFilter, query, clients]);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <Server className="h-5 w-5 text-sky-300" /> Activos ({filtered.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar activo…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:w-56"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowNew((o) => !o)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            <Plus className="h-4 w-4" /> Nuevo activo
          </button>
        </div>
      </div>

      {showNew && (
        <AssetForm
          clients={clients}
          onDone={() => setShowNew(false)}
          onSaved={() => setShowNew(false)}
        />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
        >
          <option value="todos">Todos los clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AssetType | "todos")}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
        >
          <option value="todos">Todos los tipos</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((asset) =>
          editingId === asset.id ? (
            <AssetForm
              key={asset.id}
              asset={asset}
              clients={clients}
              onDone={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          ) : (
            <div
              key={asset.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/2 p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{asset.name}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                    {TYPE_LABELS[asset.assetType]}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[asset.status]}`}
                  >
                    {STATUS_LABELS[asset.status]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{companyOf(asset.clientId)}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {asset.identifier && <span>ID: {asset.identifier}</span>}
                  {asset.ipAddress && <span>IP: {asset.ipAddress}</span>}
                  {asset.location && <span>{asset.location}</span>}
                  {asset.warrantyUntil && <span>Garantía: {asset.warrantyUntil}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingId(asset.id)}
                  className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(asset)}
                  aria-label={`Eliminar activo ${asset.name}`}
                  className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        )}

        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No hay activos que coincidan.</p>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar activo"
        body={toDelete ? `Se eliminará ${toDelete.name}.` : undefined}
        onConfirm={async () => {
          if (toDelete) await deleteAssetAction(toDelete.id);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/** Inline create/edit form. `asset` present ⇒ edit mode. */
function AssetForm({
  asset,
  clients,
  onDone,
  onSaved,
}: {
  asset?: ItAsset;
  clients: { id: string; name: string }[];
  onDone: () => void;
  onSaved: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = asset
      ? await updateAssetAction(prev, formData)
      : await createAssetAction(prev, formData);
    if (result && "success" in result) onSaved();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className={`mb-4 space-y-2 rounded-xl border bg-white/5 p-4 ${asset ? "border-sky-400/30" : "border-white/10"}`}
    >
      {asset && <input type="hidden" name="assetId" value={asset.id} />}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={asset?.name ?? ""}
          placeholder="Nombre (Server-01, Firewall principal…)"
          className={`sm:col-span-2 ${FIELD}`}
        />

        <select name="clientId" defaultValue={asset?.clientId ?? ""} disabled={!!asset} required className={FIELD}>
          <option value="" disabled>
            Cliente…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select name="assetType" defaultValue={asset?.assetType ?? "otro"} className={FIELD}>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={asset?.status ?? "activo"} className={FIELD}>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <input name="identifier" defaultValue={asset?.identifier ?? ""} placeholder="Serie / etiqueta / hostname" className={FIELD} />
        <input name="ipAddress" defaultValue={asset?.ipAddress ?? ""} placeholder="Dirección IP" className={FIELD} />
        <input name="vendor" defaultValue={asset?.vendor ?? ""} placeholder="Fabricante" className={FIELD} />
        <input name="location" defaultValue={asset?.location ?? ""} placeholder="Ubicación" className={FIELD} />

        <label className="text-xs text-gray-400">
          Adquirido
          <input name="acquiredOn" type="date" defaultValue={asset?.acquiredOn ?? ""} className={`mt-1 w-full ${FIELD}`} />
        </label>
        <label className="text-xs text-gray-400">
          Garantía hasta
          <input
            name="warrantyUntil"
            type="date"
            defaultValue={asset?.warrantyUntil ?? ""}
            className={`mt-1 w-full ${FIELD}`}
          />
        </label>

        <input name="notes" defaultValue={asset?.notes ?? ""} placeholder="Notas (opcional)" className={`sm:col-span-2 ${FIELD}`} />
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          {asset ? "Guardar cambios" : "Guardar activo"}
        </button>
      </div>
    </form>
  );
}
