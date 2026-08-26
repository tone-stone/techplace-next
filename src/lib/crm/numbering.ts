import type { createClient } from "@/lib/supabase/server";

// Not a "use server" file — see auth.ts for why: only called from within other
// server action files (createInvoiceAction, createQuoteAction).

// "{PREFIX}-{year}-{seq}" (e.g. "TP-2026-014"), seq = count of rows created this
// calendar year + 1. This is a count-existing-rows scheme, not a DB sequence/lock:
// fine for a single-admin, low-traffic internal tool, but two inserts racing between
// the count and the insert could compute the same number. The `number` column's
// unique constraint plus this retry loop is the safety net, not a full fix — if
// concurrent admin usage ever becomes real, upgrade to a Postgres sequence instead.
export async function insertWithSequentialNumber<T extends Record<string, unknown>>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "crm_invoices" | "crm_quotes",
  prefix: "TP" | "COT",
  row: T
): Promise<{ data: { id: string }; number: string } | { error: string }> {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);
  const baseSeq = (count ?? 0) + 1;

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = `${prefix}-${year}-${String(baseSeq + attempt).padStart(3, "0")}`;
    const { data, error } = await supabase
      .from(table)
      .insert({ ...row, number })
      .select("id")
      .single();
    if (!error && data) return { data, number };
    if (error && error.code !== "23505") return { error: error.message };
  }
  return { error: "No se pudo generar un folio único, intenta de nuevo" };
}
