import { createClient } from "@/lib/supabase/server";

/**
 * Shared soft-delete: marks a row `deleted_at`/`deleted_by` (never removes
 * it) and writes a full JSON snapshot to `deletion_log`. Every `delete*Action`
 * calls this after its own role gate. Not a `"use server"` file — it's only
 * ever invoked from within other server actions.
 */

export type SoftDeleteResult = { ok: true } | { ok: false; error: string };

/** Tables that carry `deleted_at` / `deleted_by` (see migrations 0018-0023). */
export type DeletableTable =
  | "crm_clients"
  | "crm_contacts"
  | "crm_projects"
  | "crm_invoices"
  | "crm_quotes"
  | "crm_tasks"
  | "crm_services"
  | "crm_contracts"
  | "it_assets"
  | "it_tickets"
  | "articles"
  | "profiles";

export async function softDelete(opts: {
  table: DeletableTable;
  id: string;
  actorId: string;
  actorEmail?: string | null;
  reason?: string | null;
}): Promise<SoftDeleteResult> {
  const supabase = await createClient();

  const { data: row, error: readErr } = await supabase
    .from(opts.table)
    .select("*")
    .eq("id", opts.id)
    .is("deleted_at", null)
    .single();
  if (readErr || !row) return { ok: false, error: "No se encontró el registro (o ya estaba eliminado)" };

  const { error: updErr } = await supabase
    .from(opts.table)
    .update({ deleted_at: new Date().toISOString(), deleted_by: opts.actorId })
    .eq("id", opts.id);
  if (updErr) return { ok: false, error: updErr.message };

  const { error: logErr } = await supabase.from("deletion_log").insert({
    table_name: opts.table,
    record_id: opts.id,
    snapshot: row,
    reason: opts.reason ?? null,
    deleted_by: opts.actorId,
    deleted_by_email: opts.actorEmail ?? null,
  });
  // The row is already gone from the user's view; a failed log insert is
  // surfaced but doesn't undo the delete.
  if (logErr) return { ok: false, error: `Eliminado, pero falló el registro: ${logErr.message}` };

  return { ok: true };
}

/** Clears `deleted_at` on a previously soft-deleted row. */
export async function undoSoftDelete(table: string, id: string): Promise<SoftDeleteResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
