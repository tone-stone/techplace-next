import type { createClient } from "@/lib/supabase/server";

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
  | "otro";

export type ClientHistoryEntry = {
  id: string;
  clientId: string;
  entryType: HistoryEntryType;
  description: string;
  createdAt: string;
};

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
