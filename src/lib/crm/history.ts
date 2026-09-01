import type { createClient } from "@/lib/supabase/server";

/**
 * Per-client activity log shared across the CRM. Every mutation that touches
 * a client (status changes, plans, payments, invoices, quotes, projects, or
 * manual notes) appends a `ClientHistoryEntry` via `addHistory`, giving the
 * client detail modal a single chronological feed of everything that
 * happened with that account.
 */

// Not a "use server" file — see auth.ts for why: addHistory() is only ever
// called from within other server action files.

export type HistoryEntryType =
  | "nota"
  | "llamada"
  | "reunion"
  | "email"
  | "pago"
  | "plan"
  | "cambio_estado"
  | "proyecto"
  | "factura"
  | "cotizacion"
  | "egreso"
  | "otro";

export type ClientHistoryEntry = {
  id: string;
  clientId: string;
  entryType: HistoryEntryType;
  description: string;
  createdAt: string;
};

/** Converts a raw `crm_client_history` row (snake_case) into a `ClientHistoryEntry`. */
export function mapHistory(row: {
  id: string;
  client_id: string;
  entry_type: string;
  description: string;
  created_at: string;
}): ClientHistoryEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    entryType: row.entry_type as HistoryEntryType,
    description: row.description,
    createdAt: row.created_at,
  };
}

/**
 * Appends one entry to a client's history log. Called by the CRM action
 * functions after a successful mutation (client, plan, payment, project,
 * invoice, or quote change) so the client detail view stays up to date.
 *
 * @param supabase - Server-side Supabase client from the calling action.
 */
export async function addHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  entryType: HistoryEntryType,
  description: string,
  userId: string
) {
  await supabase
    .from("crm_client_history")
    .insert({ client_id: clientId, entry_type: entryType, description, created_by: userId });
}
