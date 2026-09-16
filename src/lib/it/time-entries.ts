"use server";

/**
 * Time tracking for the IT Service Desk: hours logged against a ticket, plus
 * the current-month rollup per client used by the Contratos view to compare
 * work done vs the contract's included hours. Types/mapper live in
 * `./ticket-types`. Mutations gated by `requireSupport()`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireSupport } from "@/lib/crm/auth";
import { softDelete } from "@/lib/crm/soft-delete";
import { mapTimeEntry } from "./ticket-types";
import type { CrmActionState } from "@/lib/crm/clients";

export type { ItTimeEntry } from "./ticket-types";

export type ClientMonthUsage = { minutes: number; billableMinutes: number };

/** Time entries for one ticket, newest first. */
export async function getTimeEntriesByTicket(ticketId: string) {
  return withTiming("it.getTimeEntriesByTicket", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("it_ticket_time_entries")
      .select("*")
      .eq("ticket_id", ticketId)
      .is("deleted_at", null)
      .order("worked_on", { ascending: false })
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapTimeEntry);
  });
}

/**
 * Minutes logged this calendar month, grouped by the ticket's client. Used to
 * show "X h este mes / Y h incluidas" on each contract.
 */
export async function getMonthlyUsageByClient(now: Date = new Date()): Promise<Record<string, ClientMonthUsage>> {
  return withTiming("it.getMonthlyUsageByClient", async () => {
    const supabase = await createClient();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const { data } = await supabase
      .from("it_ticket_time_entries")
      .select("minutes, billable, it_tickets(client_id)")
      .is("deleted_at", null)
      .gte("worked_on", monthStart);

    const out: Record<string, ClientMonthUsage> = {};
    for (const row of (data ?? []) as unknown as {
      minutes: number;
      billable: boolean;
      it_tickets: { client_id: string } | { client_id: string }[] | null;
    }[]) {
      const t = Array.isArray(row.it_tickets) ? row.it_tickets[0] : row.it_tickets;
      if (!t?.client_id) continue;
      const bucket = (out[t.client_id] ??= { minutes: 0, billableMinutes: 0 });
      bucket.minutes += row.minutes;
      if (row.billable) bucket.billableMinutes += row.minutes;
    }
    return out;
  });
}

/** `useActionState` action for the ticket-detail "registrar tiempo" form. */
export async function addTimeEntryAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const hours = Number(formData.get("hours") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  const workedOn = String(formData.get("workedOn") ?? "").trim();
  const billable = formData.get("billable") !== "off"; // default billable

  if (!ticketId) return { error: "Ticket no válido" };
  const minutes = Math.round(hours * 60);
  if (!Number.isFinite(minutes) || minutes <= 0) return { error: "Registra un tiempo mayor a 0" };

  const supabase = await createClient();
  const { error } = await supabase.from("it_ticket_time_entries").insert({
    ticket_id: ticketId,
    user_id: check.userId,
    minutes,
    description: description || null,
    worked_on: workedOn || new Date().toISOString().slice(0, 10),
    billable,
  });
  if (error) return { error: error.message };

  await supabase.from("it_ticket_events").insert({
    ticket_id: ticketId,
    kind: "tiempo",
    detail: `Registro de tiempo: ${(minutes / 60).toFixed(2)} h`,
    actor_id: check.userId,
  });

  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes a time entry. */
export async function deleteTimeEntryAction(entryId: string): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "it_ticket_time_entries",
    id: entryId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}
