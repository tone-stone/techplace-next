"use server";

/**
 * IT Service Desk server layer. Types/enums/mappers live in `./ticket-types`
 * (a `"use server"` file may only export async functions). Every mutation is
 * gated by `requireSupport()` (dios / admin / ejecutivo). Ticket changes are
 * appended to `it_ticket_events` (immutable log); a public reply also emails
 * the client's ticket contact via `src/lib/email`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireSupport } from "@/lib/crm/auth";
import { softDelete } from "@/lib/crm/soft-delete";
import { insertWithSequentialNumber } from "@/lib/crm/numbering";
import { sendEmail } from "@/lib/email/client";
import { ticketUpdateEmail } from "@/lib/email/templates";
import type { CrmActionState } from "@/lib/crm/clients";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  mapTicket,
  mapTicketEvent,
  mapTicketMessage,
  slaDueAt,
  type TicketDetail,
  type TicketPriority,
  type TicketStatus,
} from "./ticket-types";

export type { ItTicket, ItTicketMessage, ItTicketEvent, TicketDetail, TicketPriority, TicketStatus } from "./ticket-types";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function logEvent(
  supabase: SupabaseServer,
  ticketId: string,
  kind: string,
  detail: string,
  actorId: string
) {
  await supabase.from("it_ticket_events").insert({ ticket_id: ticketId, kind, detail, actor_id: actorId });
}

/** Email of the ticket's contact (null if no contact or no email on file). */
async function ticketContactEmail(
  supabase: SupabaseServer,
  ticketId: string
): Promise<{ email: string; name: string | null; subject: string; number: string } | null> {
  const { data } = await supabase
    .from("it_tickets")
    .select("subject, number, crm_contacts(name, email)")
    .eq("id", ticketId)
    .maybeSingle();
  if (!data) return null;
  const c = Array.isArray(data.crm_contacts) ? data.crm_contacts[0] : data.crm_contacts;
  if (!c?.email) return null;
  return { email: c.email, name: c.name ?? null, subject: data.subject, number: data.number };
}

/** Every live ticket, newest first. */
export async function getTickets() {
  return withTiming("it.getTickets", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("it_tickets")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapTicket);
  });
}

/** One ticket with its message thread and event log. */
export async function getTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient();
  const [{ data: ticket }, { data: messages }, { data: events }] = await Promise.all([
    supabase.from("it_tickets").select("*").eq("id", ticketId).is("deleted_at", null).maybeSingle(),
    supabase
      .from("it_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
    supabase
      .from("it_ticket_events")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true }),
  ]);
  if (!ticket) return null;
  return {
    ticket: mapTicket(ticket),
    messages: (messages ?? []).map(mapTicketMessage),
    events: (events ?? []).map(mapTicketEvent),
  };
}

/** `useActionState` action backing the "Nuevo ticket" form. */
export async function createTicketAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const pick = (k: string) => String(formData.get(k) ?? "").trim();
  const clientId = pick("clientId");
  const subject = pick("subject");
  const priorityRaw = pick("priority");
  const priority = TICKET_PRIORITIES.includes(priorityRaw as TicketPriority)
    ? (priorityRaw as TicketPriority)
    : "media";

  if (!clientId || !subject) {
    return { error: "Selecciona un cliente y escribe el asunto del ticket" };
  }

  const supabase = await createClient();
  const result = await insertWithSequentialNumber(supabase, "it_tickets", "TK", {
    client_id: clientId,
    contact_id: pick("contactId") || null,
    asset_id: pick("assetId") || null,
    assignee_id: pick("assigneeId") || null,
    subject,
    description: pick("description") || null,
    priority,
    category: pick("category") || null,
    sla_due_at: slaDueAt(priority),
    created_by: check.userId,
  });
  if ("error" in result) return { error: result.error };

  await logEvent(supabase, result.data.id, "creado", `Ticket ${result.number} creado`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** Moves a ticket to a new status, stamping resolved/closed timestamps. */
export async function updateTicketStatusAction(
  ticketId: string,
  status: TicketStatus
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };
  if (!TICKET_STATUSES.includes(status)) return { error: "Estado inválido" };

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "resuelto") patch.resolved_at = nowIso;
  if (status === "cerrado") patch.closed_at = nowIso;
  if (status !== "resuelto" && status !== "cerrado") {
    patch.resolved_at = null;
    patch.closed_at = null;
  }

  const { error } = await supabase.from("it_tickets").update(patch).eq("id", ticketId);
  if (error) return { error: error.message };

  await logEvent(supabase, ticketId, "estado", `Estado → ${STATUS_LABELS[status]}`, check.userId);

  if (status === "resuelto") {
    const contact = await ticketContactEmail(supabase, ticketId);
    if (contact) {
      const { subject, html } = ticketUpdateEmail({
        number: contact.number,
        ticketSubject: contact.subject,
        contactName: contact.name,
        heading: "Tu ticket fue marcado como resuelto",
        body: "Si el problema persiste, responde a este ticket y lo reabrimos.",
      });
      await sendEmail({ to: contact.email, subject, html });
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

/** Assigns (or unassigns, `assigneeId = null`) the ticket. */
export async function assignTicketAction(
  ticketId: string,
  assigneeId: string | null
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("it_tickets")
    .update({ assignee_id: assigneeId })
    .eq("id", ticketId);
  if (error) return { error: error.message };

  await logEvent(
    supabase,
    ticketId,
    "asignado",
    assigneeId ? "Ticket asignado" : "Asignación retirada",
    check.userId
  );
  revalidatePath("/admin");
  return { success: true };
}

/** Changes priority and recomputes the SLA target from now. */
export async function updateTicketPriorityAction(
  ticketId: string,
  priority: TicketPriority
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };
  if (!TICKET_PRIORITIES.includes(priority)) return { error: "Prioridad inválida" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("it_tickets")
    .update({ priority, sla_due_at: slaDueAt(priority) })
    .eq("id", ticketId);
  if (error) return { error: error.message };

  await logEvent(supabase, ticketId, "prioridad", `Prioridad → ${PRIORITY_LABELS[priority]}`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action for the reply box. `isInternal` hides it from the client. */
export async function addTicketMessageAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";
  if (!ticketId || !body) return { error: "Escribe un mensaje" };

  const supabase = await createClient();
  const { error } = await supabase.from("it_ticket_messages").insert({
    ticket_id: ticketId,
    body,
    is_internal: isInternal,
    author_id: check.userId,
  });
  if (error) return { error: error.message };

  await logEvent(
    supabase,
    ticketId,
    "mensaje",
    isInternal ? "Nota interna añadida" : "Respuesta enviada al cliente",
    check.userId
  );

  if (!isInternal) {
    const contact = await ticketContactEmail(supabase, ticketId);
    if (contact) {
      const { subject, html } = ticketUpdateEmail({
        number: contact.number,
        ticketSubject: contact.subject,
        contactName: contact.name,
        heading: "Nueva respuesta en tu ticket",
        body,
      });
      await sendEmail({ to: contact.email, subject, html });
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes a ticket (recoverable; logged to `deletion_log`). */
export async function deleteTicketAction(ticketId: string): Promise<CrmActionState> {
  const check = await requireSupport();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "it_tickets",
    id: ticketId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}
