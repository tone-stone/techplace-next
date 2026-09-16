"use server";

/**
 * Read + restore for the `deletion_log` bitácora, surfaced in Monitoreo →
 * Eliminaciones. Everything here is `dios`/`admin` only.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canSeeMonitoring, type ProfileRole } from "@/lib/auth/roles";

export type DeletionEntry = {
  id: string;
  table: string;
  recordId: string;
  reason: string | null;
  deletedByEmail: string | null;
  deletedAt: string;
  snapshot: Record<string, unknown>;
};

async function requireMonitor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();
  const role = (data as ProfileRole | null)?.role;
  return role && canSeeMonitoring(role)
    ? { ok: true as const, userId: user.id }
    : { ok: false as const };
}

/** Most recent entries first. */
export async function getDeletionLog(limit = 100): Promise<DeletionEntry[]> {
  if (!(await requireMonitor()).ok) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("deletion_log")
    .select("id, table_name, record_id, reason, deleted_by_email, deleted_at, snapshot")
    .order("deleted_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    id: r.id as string,
    table: r.table_name as string,
    recordId: r.record_id as string,
    reason: (r.reason as string | null) ?? null,
    deletedByEmail: (r.deleted_by_email as string | null) ?? null,
    deletedAt: r.deleted_at as string,
    snapshot: (r.snapshot ?? {}) as Record<string, unknown>,
  }));
}

/** Clears `deleted_at` on the row a log entry points to (and unbans an account). */
export async function restoreDeletionAction(
  logId: string
): Promise<{ success: true } | { error: string }> {
  const check = await requireMonitor();
  if (!check.ok) return { error: "Sin permiso" };

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("deletion_log")
    .select("table_name, record_id")
    .eq("id", logId)
    .single();
  if (!entry) return { error: "Registro no encontrado" };

  if (entry.table_name === "profiles") {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", entry.record_id);
    if (error) return { error: error.message };
    await admin.auth.admin.updateUserById(entry.record_id as string, { ban_duration: "none" });
    return { success: true };
  }

  const { error } = await supabase
    .from(entry.table_name as string)
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", entry.record_id);
  if (error) return { error: error.message };
  return { success: true };
}
