"use client";

/**
 * Monitoreo → Eliminaciones: the `deletion_log` bitácora. Lists every
 * soft-deleted record (qué, quién, cuándo) with an expandable JSON snapshot
 * and a "Restaurar" button. dios/admin only — the server actions enforce it.
 */

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, RotateCcw, Trash2 } from "lucide-react";
import {
  getDeletionLog,
  restoreDeletionAction,
  type DeletionEntry,
} from "@/lib/monitoring/deletions";

const TABLE_LABELS: Record<string, string> = {
  crm_clients: "Cliente",
  crm_projects: "Proyecto",
  crm_invoices: "Factura",
  crm_quotes: "Cotización",
  crm_tasks: "Tarea",
  articles: "Artículo",
  profiles: "Cuenta",
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

/** Best-effort human label for a snapshot (title / name / company / email). */
function snapshotLabel(s: Record<string, unknown>): string {
  for (const k of ["title", "name", "company", "email", "number"]) {
    if (typeof s[k] === "string" && s[k]) return s[k] as string;
  }
  return "—";
}

export default function DeletionsSection() {
  const [entries, setEntries] = useState<DeletionEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = () => {
    getDeletionLog()
      .then(setEntries)
      .catch(() => setError("No se pudo cargar el registro."));
  };

  useEffect(load, []);

  const restore = (id: string) => {
    setError(null);
    startTransition(async () => {
      const res = await restoreDeletionAction(id);
      if ("error" in res) setError(res.error);
      else load();
    });
  };

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Trash2 className="h-4 w-4 text-red-300" />
        <h2 className="text-lg font-bold text-white">Eliminaciones</h2>
        <span className="ml-auto text-xs text-gray-500">recuperables</span>
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {entries === null ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">Nada eliminado todavía.</p>
      ) : (
        <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
          {entries.map((e) => (
            <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === e.id ? null : e.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <ChevronDown
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500 transition-transform ${
                      openId === e.id ? "rotate-180" : ""
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      <span className="text-gray-400">{TABLE_LABELS[e.table] ?? e.table}:</span>{" "}
                      {snapshotLabel(e.snapshot)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {e.deletedByEmail ?? "—"} · {timeAgo(e.deletedAt)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => restore(e.id)}
                  disabled={pending}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                </button>
              </div>
              {openId === e.id && (
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-gray-400">
                  {JSON.stringify(e.snapshot, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
