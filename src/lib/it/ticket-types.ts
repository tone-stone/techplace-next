/**
 * Pure types + constants + mappers for IT Service Desk tickets. Kept out of
 * `tickets.ts` (a `"use server"` file may only export async functions).
 */

export type TicketStatus =
  | "nuevo"
  | "abierto"
  | "en_progreso"
  | "en_espera"
  | "resuelto"
  | "cerrado";

export type TicketPriority = "baja" | "media" | "alta" | "critica";

export const TICKET_STATUSES: TicketStatus[] = [
  "nuevo",
  "abierto",
  "en_progreso",
  "en_espera",
  "resuelto",
  "cerrado",
];

export const TICKET_PRIORITIES: TicketPriority[] = ["baja", "media", "alta", "critica"];

/** Terminal statuses that carry a resolved/closed timestamp. */
export const TICKET_OPEN_STATUSES: TicketStatus[] = ["nuevo", "abierto", "en_progreso", "en_espera"];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  nuevo: "Nuevo",
  abierto: "Abierto",
  en_progreso: "En progreso",
  en_espera: "En espera",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

/** Response/resolution target window per priority, in hours. Example defaults —
 *  tune per contract when the Contracts phase lands. */
export const SLA_HOURS: Record<TicketPriority, number> = {
  critica: 4,
  alta: 8,
  media: 24,
  baja: 72,
};

/** ISO string for when this ticket's SLA target falls, given a start instant. */
export function slaDueAt(priority: TicketPriority, from: Date = new Date()): string {
  return new Date(from.getTime() + SLA_HOURS[priority] * 3_600_000).toISOString();
}

export type ItTicket = {
  id: string;
  number: string;
  clientId: string;
  contactId: string | null;
  assetId: string | null;
  assigneeId: string | null;
  subject: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  slaDueAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

export type ItTicketMessage = {
  id: string;
  ticketId: string;
  body: string;
  isInternal: boolean;
  authorId: string | null;
  createdAt: string;
};

export type ItTicketEvent = {
  id: string;
  ticketId: string;
  kind: string;
  detail: string;
  createdAt: string;
};

export type ItTimeEntry = {
  id: string;
  ticketId: string;
  userId: string | null;
  minutes: number;
  description: string | null;
  workedOn: string;
  billable: boolean;
  createdAt: string;
};

export type TicketDetail = {
  ticket: ItTicket;
  messages: ItTicketMessage[];
  events: ItTicketEvent[];
  timeEntries: ItTimeEntry[];
};

/** Minutes → "1h 30m" / "45m" / "2h". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function mapTicket(row: {
  id: string;
  number: string;
  client_id: string;
  contact_id: string | null;
  asset_id: string | null;
  assignee_id: string | null;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
}): ItTicket {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    contactId: row.contact_id,
    assetId: row.asset_id,
    assigneeId: row.assignee_id,
    subject: row.subject,
    description: row.description,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    category: row.category,
    slaDueAt: row.sla_due_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
  };
}

export function mapTicketMessage(row: {
  id: string;
  ticket_id: string;
  body: string;
  is_internal: boolean;
  author_id: string | null;
  created_at: string;
}): ItTicketMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    body: row.body,
    isInternal: row.is_internal,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

export function mapTicketEvent(row: {
  id: string;
  ticket_id: string;
  kind: string;
  detail: string;
  created_at: string;
}): ItTicketEvent {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    kind: row.kind,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

export function mapTimeEntry(row: {
  id: string;
  ticket_id: string;
  user_id: string | null;
  minutes: number;
  description: string | null;
  worked_on: string;
  billable: boolean;
  created_at: string;
}): ItTimeEntry {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    userId: row.user_id,
    minutes: row.minutes,
    description: row.description,
    workedOn: row.worked_on,
    billable: row.billable,
    createdAt: row.created_at,
  };
}
