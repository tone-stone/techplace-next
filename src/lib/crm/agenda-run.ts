/**
 * Agenda engine, run once a day by `src/app/api/cron/agenda/route.ts` (a few
 * minutes after the cobranza cron). Not a `"use server"` file: invoked only
 * from that trusted route with `createAdminClient` (service-role).
 *
 * Collects everything coming due inside the configured lead window —
 * unfinished tasks and projects with a `due_date`, and open support tickets
 * with an `sla_due_at` — plus anything already overdue, and sends dios/admin
 * one internal digest (email always, WhatsApp when the internal list is set).
 * Payments are left to the cobranza cron so the two don't double up.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { sendWhatsApp } from "@/lib/whatsapp/client";
import { agendaDigestEmail } from "@/lib/email/templates";
import { agendaDigestWhatsApp, type AgendaItem } from "@/lib/notify/messages";
import { readNotifySettings } from "@/lib/notify/config";
import { daysUntil } from "./plan-status";
import { toISODate } from "./billing-run";

export type AgendaRunResult = {
  items: number;
  tasks: number;
  projects: number;
  tickets: number;
  emailSent: boolean;
  whatsappSent: boolean;
  errors: string[];
};

/** Supabase embeds a to-one FK as an object, but its types often say array. Normalize. */
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? v[0] ?? null : v ?? null;
}

export async function runAgendaCycle(now: Date = new Date()): Promise<AgendaRunResult> {
  const supabase = createAdminClient();
  const errors: string[] = [];

  const notify = await readNotifySettings(async (cols) => {
    const { data } = await supabase.from("app_settings").select(cols).eq("id", true).maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  });

  const leadDays = notify.agendaReminderLeadDays;
  const horizonDate = toISODate(new Date(now.getTime() + leadDays * 86_400_000));
  const horizonTs = new Date(now.getTime() + (leadDays + 1) * 86_400_000).toISOString();
  const items: AgendaItem[] = [];
  let tasks = 0;
  let projects = 0;
  let tickets = 0;

  // --- Tasks --------------------------------------------------------------
  const { data: taskRows, error: taskErr } = await supabase
    .from("crm_tasks")
    .select("title, due_date, status, crm_clients(company)")
    .neq("status", "terminado")
    .not("due_date", "is", null)
    .lte("due_date", horizonDate)
    .is("deleted_at", null);
  if (taskErr) errors.push(`tasks: ${taskErr.message}`);
  for (const r of taskRows ?? []) {
    if (!r.due_date) continue;
    tasks++;
    items.push({
      kind: "tarea",
      title: r.title,
      company: one(r.crm_clients as unknown as { company: string } | { company: string }[] | null)?.company ?? null,
      date: r.due_date,
      daysLeft: daysUntil(r.due_date, now),
    });
  }

  // --- Projects ---------------------------------------------------------
  const { data: projectRows, error: projErr } = await supabase
    .from("crm_projects")
    .select("name, due_date, status, crm_clients(company)")
    .neq("status", "completado")
    .not("due_date", "is", null)
    .lte("due_date", horizonDate)
    .is("deleted_at", null);
  if (projErr) errors.push(`projects: ${projErr.message}`);
  for (const r of projectRows ?? []) {
    if (!r.due_date) continue;
    projects++;
    items.push({
      kind: "proyecto",
      title: r.name,
      company: one(r.crm_clients as unknown as { company: string } | { company: string }[] | null)?.company ?? null,
      date: r.due_date,
      daysLeft: daysUntil(r.due_date, now),
    });
  }

  // --- Support tickets (SLA) -------------------------------------------
  const { data: ticketRows, error: tkErr } = await supabase
    .from("it_tickets")
    .select("number, subject, sla_due_at, status, crm_clients(company)")
    .not("status", "in", "(resuelto,cerrado)")
    .not("sla_due_at", "is", null)
    .lte("sla_due_at", horizonTs)
    .is("deleted_at", null);
  if (tkErr) errors.push(`tickets: ${tkErr.message}`);
  for (const r of ticketRows ?? []) {
    if (!r.sla_due_at) continue;
    tickets++;
    const date = String(r.sla_due_at).slice(0, 10);
    items.push({
      kind: "soporte",
      title: `${r.number} · ${r.subject}`,
      company: one(r.crm_clients as unknown as { company: string } | { company: string }[] | null)?.company ?? null,
      date,
      daysLeft: daysUntil(date, now),
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  // --- Deliver ---------------------------------------------------------
  let emailSent = false;
  let whatsappSent = false;
  if (items.length > 0) {
    const { data: staff } = await supabase
      .from("profiles")
      .select("email")
      .in("role", ["dios", "admin"])
      .is("deleted_at", null);
    const recipients = [
      ...new Set([
        ...(staff ?? []).map((s) => s.email).filter((e): e is string => !!e),
        ...notify.internalEmail,
      ]),
    ];

    if (recipients.length > 0) {
      const { subject, html } = agendaDigestEmail({ orgName: notify.orgName, items });
      const sent = await sendEmail({ to: recipients, subject, html, from: notify.fromEmail });
      if (sent.ok) emailSent = true;
      else errors.push(`agenda email: ${sent.error}`);
    }

    if (notify.whatsappReady && notify.internalWhatsApp.length > 0) {
      const wa = await sendWhatsApp({
        to: notify.internalWhatsApp,
        body: agendaDigestWhatsApp({ orgName: notify.orgName, items }),
      });
      if (wa.ok) whatsappSent = wa.sent > 0;
      else errors.push(`agenda wa: ${wa.error}`);
    }
  }

  return { items: items.length, tasks, projects, tickets, emailSent, whatsappSent, errors };
}
