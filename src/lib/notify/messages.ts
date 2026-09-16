/**
 * Plain-text WhatsApp message builders — the WhatsApp counterpart of the HTML
 * builders in `src/lib/email/templates.ts`. WhatsApp renders `*bold*` and
 * `_italic_` but no HTML, so these stay short and line-based.
 */

import { formatCurrencyMXN } from "@/lib/crm/format";

export type AgendaItem = {
  kind: "tarea" | "proyecto" | "soporte";
  title: string;
  company: string | null;
  date: string;
  daysLeft: number;
};

const KIND_LABEL: Record<AgendaItem["kind"], string> = {
  tarea: "Tarea",
  proyecto: "Proyecto",
  soporte: "Soporte (SLA)",
};

function whenLabel(daysLeft: number, date: string): string {
  if (daysLeft < 0) return `venció ${date}`;
  if (daysLeft === 0) return `vence hoy (${date})`;
  if (daysLeft === 1) return `vence mañana (${date})`;
  return `vence en ${daysLeft} días (${date})`;
}

/** Reminder for one payment, addressed to the client contact. */
export function paymentReminderWhatsApp(opts: {
  orgName: string;
  contactName: string | null;
  planName: string | null;
  amount: number;
  dueDate: string;
  daysLeft: number;
}): string {
  const hi = opts.contactName ? `Hola ${opts.contactName},` : "Hola,";
  const head =
    opts.daysLeft < 0
      ? `tienes un pago *vencido* desde el ${opts.dueDate}.`
      : `te recordamos tu pago con vencimiento el *${opts.dueDate}* (en ${opts.daysLeft} día(s)).`;
  return [
    hi,
    head,
    opts.planName ? `Concepto: ${opts.planName}` : null,
    `Monto: *${formatCurrencyMXN(opts.amount)}*`,
    "",
    `Si ya realizaste el pago, ignora este mensaje. — ${opts.orgName}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/** Internal roll-up of outstanding collections. */
export function collectionsDigestWhatsApp(opts: {
  orgName: string;
  generated: number;
  markedOverdue: number;
  overdue: { company: string; amount: number; dueDate: string }[];
  dueThisWeek: { company: string; amount: number; dueDate: string }[];
}): string {
  const line = (r: { company: string; amount: number; dueDate: string }) =>
    `• ${r.company} — ${formatCurrencyMXN(r.amount)} (${r.dueDate})`;
  const block = (title: string, rows: { company: string; amount: number; dueDate: string }[]) =>
    rows.length ? `\n*${title}*\n${rows.map(line).join("\n")}` : "";
  return [
    `*Cobranza ${opts.orgName}*`,
    `${opts.generated} cargo(s) nuevo(s), ${opts.markedOverdue} marcado(s) vencido(s).`,
    block(`Vencidos (${opts.overdue.length})`, opts.overdue),
    block(`Por vencer esta semana (${opts.dueThisWeek.length})`, opts.dueThisWeek),
  ]
    .filter(Boolean)
    .join("\n");
}

/** Sent to the client when a quote is marked "enviada". */
export function quoteSentWhatsApp(opts: {
  orgName: string;
  number: string;
  contactName: string | null;
  total: number;
  validUntil: string | null;
}): string {
  const hi = opts.contactName ? `Hola ${opts.contactName},` : "Hola,";
  return [
    hi,
    `te compartimos la cotización *${opts.number}* por un total de *${formatCurrencyMXN(opts.total)}*.`,
    opts.validUntil ? `Vigente hasta el ${opts.validUntil}.` : null,
    "",
    `Quedamos atentos a tus comentarios. — ${opts.orgName}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/** Internal alert when a client accepts a quote. */
export function quoteAcceptedWhatsApp(opts: {
  orgName: string;
  number: string;
  clientName: string;
  total: number;
}): string {
  return [
    `*Cotización aceptada* — ${opts.orgName}`,
    `${opts.number} · ${opts.clientName}`,
    `Total: *${formatCurrencyMXN(opts.total)}*`,
    "Conviértela en plan desde el detalle de la cotización.",
  ].join("\n");
}

/** Internal daily agenda of what's due soon. */
export function agendaDigestWhatsApp(opts: { orgName: string; items: AgendaItem[] }): string {
  const lines = opts.items.map(
    (i) =>
      `• ${KIND_LABEL[i.kind]}: ${i.title}${i.company ? ` — ${i.company}` : ""} · ${whenLabel(
        i.daysLeft,
        i.date
      )}`
  );
  return [`*Agenda ${opts.orgName}*`, `${opts.items.length} pendiente(s) próximos:`, "", ...lines].join(
    "\n"
  );
}
