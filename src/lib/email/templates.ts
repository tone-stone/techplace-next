/**
 * HTML builders for the two cobranza emails: a per-payment reminder sent to the
 * client's primary contact, and a daily internal digest sent to dios/admin.
 * Plain inline-styled HTML — no framework, safe for any mail client.
 */

import { formatCurrencyMXN } from "@/lib/crm/format";

export type CollectionRow = {
  company: string;
  contactName: string | null;
  planName: string | null;
  amount: number;
  dueDate: string;
  daysLeft: number;
  status: "pendiente" | "vencido";
};

function shell(title: string, body: string): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
  <h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
  ${body}
  <p style="font-size:12px;color:#64748b;margin-top:24px">Mensaje automático de cobranza</p>
</div>`;
}

/** Reminder for one payment, addressed to the client contact. */
export function paymentReminderEmail(opts: {
  company: string;
  contactName: string | null;
  planName: string | null;
  amount: number;
  dueDate: string;
  daysLeft: number;
}): { subject: string; html: string } {
  const overdue = opts.daysLeft < 0;
  const subject = overdue
    ? `Pago vencido — ${formatCurrencyMXN(opts.amount)}`
    : `Recordatorio de pago — vence ${opts.dueDate}`;
  const line = overdue
    ? `Tienes un pago <strong>vencido</strong> desde el ${opts.dueDate}.`
    : `Te recordamos el pago con vencimiento el <strong>${opts.dueDate}</strong> (en ${opts.daysLeft} día(s)).`;
  const html = shell(overdue ? "Pago vencido" : "Recordatorio de pago", `
    <p>${opts.contactName ? `Hola ${opts.contactName},` : "Hola,"}</p>
    <p>${line}</p>
    <ul style="font-size:14px;padding-left:18px">
      <li>Empresa: ${opts.company}</li>
      ${opts.planName ? `<li>Concepto: ${opts.planName}</li>` : ""}
      <li>Monto: <strong>${formatCurrencyMXN(opts.amount)}</strong></li>
    </ul>
    <p>Si ya realizaste el pago, ignora este mensaje.</p>`);
  return { subject, html };
}

/** Daily internal roll-up of what needs collecting. */
export function collectionsDigestEmail(opts: {
  orgName: string;
  generated: number;
  markedOverdue: number;
  dueThisWeek: CollectionRow[];
  overdue: CollectionRow[];
  missingEmail: CollectionRow[];
}): { subject: string; html: string } {
  const table = (list: CollectionRow[]) =>
    list.length === 0
      ? `<p style="font-size:14px;color:#64748b">— nada —</p>`
      : `<table style="width:100%;border-collapse:collapse;font-size:13px">${list
          .map(
            (r) =>
              `<tr>
                <td style="padding:4px 8px 4px 0">${r.company}</td>
                <td style="padding:4px 8px 4px 0;color:#64748b">${r.planName ?? ""}</td>
                <td style="padding:4px 0;text-align:right"><strong>${formatCurrencyMXN(r.amount)}</strong></td>
                <td style="padding:4px 0 4px 8px;color:#64748b">${r.dueDate}</td>
              </tr>`
          )
          .join("")}</table>`;

  const html = shell("Resumen de cobranza", `
    <p style="font-size:14px">Se generaron <strong>${opts.generated}</strong> cargo(s) nuevo(s) y se marcaron <strong>${opts.markedOverdue}</strong> como vencido(s).</p>
    <h3 style="font-size:14px;margin:16px 0 4px">Vencidos (${opts.overdue.length})</h3>${table(opts.overdue)}
    <h3 style="font-size:14px;margin:16px 0 4px">Por vencer esta semana (${opts.dueThisWeek.length})</h3>${table(opts.dueThisWeek)}
    <h3 style="font-size:14px;margin:16px 0 4px">Sin correo de contacto — avisar a mano (${opts.missingEmail.length})</h3>${table(opts.missingEmail)}`);

  return {
    subject: `Cobranza ${opts.orgName}: ${opts.overdue.length} vencido(s), ${opts.dueThisWeek.length} por vencer`,
    html,
  };
}
