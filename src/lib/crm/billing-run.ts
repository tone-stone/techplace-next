/**
 * Cobranza engine, run once a day by `src/app/api/cron/cobranza/route.ts`.
 * Not a `"use server"` file: it's invoked only from that trusted route handler
 * and uses `createAdminClient` (service-role, bypasses RLS) because there's no
 * signed-in user behind a cron.
 *
 * Each run, in order:
 *  1. Generates a `crm_payments` row for every active plan whose `next_due_date`
 *     has arrived, then advances the plan's `next_due_date` one billing cycle
 *     and stamps `last_billed_date` (idempotent — a second run the same day
 *     does nothing).
 *  2. Flips still-`pendiente` payments past their `due_date` to `vencido`.
 *  3. Notifies the client's primary contact (email, and WhatsApp when enabled)
 *     for payments inside the configured lead window and freshly overdue ones
 *     (once each — the stamp is set if any channel delivered).
 *  4. Sends dios/admin an internal digest of everything outstanding (email +
 *     optional internal WhatsApp).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/client";
import { sendWhatsApp } from "@/lib/whatsapp/client";
import { collectionsDigestEmail, paymentReminderEmail, type CollectionRow } from "@/lib/email/templates";
import { collectionsDigestWhatsApp, paymentReminderWhatsApp } from "@/lib/notify/messages";
import { readNotifySettings } from "@/lib/notify/config";
import { formatCurrencyMXN } from "./format";
import { daysUntil } from "./plan-status";
import type { BillingCycle } from "./clients";

const DAY_MS = 86_400_000;
const DUE_SOON_WINDOW_DAYS = 7;

/** `Date` -> `YYYY-MM-DD` (UTC). The cron fires at 15:00 UTC ≈ 09:00 CST, so the UTC date matches the Mexican calendar day. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Next `next_due_date` for a plan: advance the month by the cycle length and
 * land on the plan's `cutoffDay`, clamped to the last day of that month
 * (so cutoff 31 -> Feb 28/29).
 */
export function advanceDueDate(dueDate: string, cycle: BillingCycle, cutoffDay: number): string {
  const [year, month] = dueDate.split("-").map(Number);
  const monthsToAdd = cycle === "anual" ? 12 : cycle === "trimestral" ? 3 : 1;
  const target = new Date(Date.UTC(year, month - 1 + monthsToAdd, 1));
  const ty = target.getUTCFullYear();
  const tm = target.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const day = Math.min(Math.max(Math.trunc(cutoffDay) || 1, 1), daysInMonth);
  return `${ty}-${String(tm + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export type BillingRunResult = {
  generated: number;
  markedOverdue: number;
  remindersSent: number;
  whatsappRemindersSent: number;
  remindersSkippedNoContact: number;
  digestSent: boolean;
  digestWhatsAppSent: boolean;
  errors: string[];
};

/** Supabase embeds a to-one FK as an object, but its types often say array. Normalize. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

type OpenPaymentRow = {
  id: string;
  plan_id: string | null;
  amount: number | string;
  due_date: string;
  status: "pendiente" | "vencido";
  reminder_sent_at: string | null;
  overdue_notified_at: string | null;
  crm_plans: { name: string } | { name: string }[] | null;
  crm_clients:
    | {
        company: string;
        crm_contacts: {
          name: string;
          email: string | null;
          phone: string | null;
          is_primary: boolean;
          deleted_at: string | null;
        }[];
      }
    | null;
};

export async function runBillingCycle(now: Date = new Date()): Promise<BillingRunResult> {
  const supabase = createAdminClient();
  const today = toISODate(now);
  const errors: string[] = [];
  let generated = 0;

  // --- 1. Generate charges from due active plans ----------------------------
  const { data: duePlans, error: plansErr } = await supabase
    .from("crm_plans")
    .select(
      "id, client_id, name, amount, billing_cycle, cutoff_day, next_due_date, last_billed_date, crm_clients!inner(deleted_at)"
    )
    .eq("status", "activo")
    .is("deleted_at", null)
    .is("crm_clients.deleted_at", null)
    .lte("next_due_date", today);
  if (plansErr) errors.push(`plans: ${plansErr.message}`);

  for (const plan of duePlans ?? []) {
    // Guard against a double run: the last charge already covers this cycle.
    if (plan.last_billed_date && plan.last_billed_date >= plan.next_due_date) continue;

    const { error: insErr } = await supabase.from("crm_payments").insert({
      client_id: plan.client_id,
      plan_id: plan.id,
      amount: plan.amount,
      due_date: plan.next_due_date,
      status: "pendiente",
    });
    if (insErr) {
      errors.push(`payment insert (plan ${plan.id}): ${insErr.message}`);
      continue;
    }

    const nextDue = advanceDueDate(plan.next_due_date, plan.billing_cycle as BillingCycle, plan.cutoff_day);
    const { error: updErr } = await supabase
      .from("crm_plans")
      .update({ next_due_date: nextDue, last_billed_date: plan.next_due_date })
      .eq("id", plan.id);
    if (updErr) errors.push(`plan advance (${plan.id}): ${updErr.message}`);

    await supabase.from("crm_client_history").insert({
      client_id: plan.client_id,
      entry_type: "pago",
      description: `Cargo de ${formatCurrencyMXN(Number(plan.amount))} generado automáticamente (plan "${plan.name}"), vence ${plan.next_due_date}`,
      created_by: null,
    });

    // Recurring maintenance task for this period — one per (plan, period).
    const { data: existingTask } = await supabase
      .from("crm_tasks")
      .select("id")
      .eq("plan_id", plan.id)
      .eq("due_date", plan.next_due_date)
      .maybeSingle();
    if (!existingTask) {
      const periodLabel = new Date(`${plan.next_due_date}T00:00:00`).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      });
      const { error: taskErr } = await supabase.from("crm_tasks").insert({
        client_id: plan.client_id,
        plan_id: plan.id,
        title: `Mantenimiento ${periodLabel} — ${plan.name}`,
        status: "por_hacer",
        due_date: plan.next_due_date,
        created_by: null,
      });
      if (taskErr) errors.push(`maintenance task (plan ${plan.id}): ${taskErr.message}`);
    }

    generated++;
  }

  // --- 2. Mark overdue ---------------------------------------------------------
  const { data: overdueRows, error: overdueErr } = await supabase
    .from("crm_payments")
    .update({ status: "vencido" })
    .eq("status", "pendiente")
    .lt("due_date", today)
    .is("deleted_at", null)
    .select("id");
  if (overdueErr) errors.push(`overdue: ${overdueErr.message}`);
  const markedOverdue = overdueRows?.length ?? 0;

  // --- 3. Settings ----------------------------------------------------------
  const notify = await readNotifySettings(async (cols) => {
    const { data } = await supabase.from("app_settings").select(cols).eq("id", true).maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  });
  const orgName = notify.orgName;
  const leadDays = notify.billingReminderLeadDays;
  const fromEmail = notify.fromEmail;
  const horizon = toISODate(new Date(now.getTime() + leadDays * DAY_MS));

  // --- 4/5. One pass over every outstanding payment (reminders + digest) ---
  const { data: openRaw } = await supabase
    .from("crm_payments")
    .select(
      `id, plan_id, amount, due_date, status, reminder_sent_at, overdue_notified_at,
       crm_plans(name),
       crm_clients!inner(company, deleted_at, crm_contacts(name, email, phone, is_primary, deleted_at))`
    )
    .in("status", ["pendiente", "vencido"])
    .is("deleted_at", null)
    .is("crm_clients.deleted_at", null)
    .order("due_date", { ascending: true });
  const open = (openRaw ?? []) as unknown as OpenPaymentRow[];

  let remindersSent = 0;
  let whatsappRemindersSent = 0;
  let remindersSkippedNoContact = 0;
  const missingEmail: CollectionRow[] = [];
  const dueThisWeek: CollectionRow[] = [];
  const overdue: CollectionRow[] = [];

  for (const p of open) {
    const client = one(p.crm_clients);
    const plan = one(p.crm_plans);
    const primary =
      client?.crm_contacts?.find((c) => c.is_primary && !c.deleted_at) ?? null;
    const daysLeft = daysUntil(p.due_date, now);

    const row: CollectionRow = {
      company: client?.company ?? "—",
      contactName: primary?.name ?? null,
      planName: plan?.name ?? null,
      amount: Number(p.amount),
      dueDate: p.due_date,
      daysLeft,
      status: p.status,
    };

    // Digest buckets
    if (p.status === "vencido" || daysLeft < 0) overdue.push(row);
    else if (daysLeft <= DUE_SOON_WINDOW_DAYS) dueThisWeek.push(row);

    // Reminder eligibility
    const needsPendingReminder =
      p.status === "pendiente" && p.due_date <= horizon && !p.reminder_sent_at;
    const needsOverdueReminder = p.status === "vencido" && !p.overdue_notified_at;
    if (!needsPendingReminder && !needsOverdueReminder) continue;

    const waAddress = notify.whatsappReady ? primary?.phone ?? null : null;
    if (!primary?.email && !waAddress) {
      remindersSkippedNoContact++;
      missingEmail.push(row);
      continue;
    }

    let delivered = false;

    if (primary?.email) {
      const { subject, html } = paymentReminderEmail({
        company: row.company,
        contactName: row.contactName,
        planName: row.planName,
        amount: row.amount,
        dueDate: row.dueDate,
        daysLeft: row.daysLeft,
      });
      const sent = await sendEmail({ to: primary.email, subject, html, from: fromEmail });
      if (sent.ok) {
        remindersSent++;
        delivered = true;
      } else {
        errors.push(`reminder ${p.id}: ${sent.error}`);
      }
    }

    if (waAddress) {
      const body = paymentReminderWhatsApp({
        orgName,
        contactName: row.contactName,
        planName: row.planName,
        amount: row.amount,
        dueDate: row.dueDate,
        daysLeft: row.daysLeft,
      });
      const wa = await sendWhatsApp({ to: waAddress, body });
      if (wa.ok) {
        if (wa.sent > 0) whatsappRemindersSent++;
        delivered = true;
      } else {
        errors.push(`reminder wa ${p.id}: ${wa.error}`);
      }
    }

    if (delivered) {
      await supabase
        .from("crm_payments")
        .update(
          p.status === "vencido"
            ? { overdue_notified_at: now.toISOString() }
            : { reminder_sent_at: now.toISOString() }
        )
        .eq("id", p.id);
    }
  }

  // --- 6. Internal digest --------------------------------------------------
  let digestSent = false;
  let digestWhatsAppSent = false;
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
  const hasNews =
    generated || markedOverdue || overdue.length || dueThisWeek.length || missingEmail.length;

  if (recipients.length > 0 && hasNews) {
    const { subject, html } = collectionsDigestEmail({
      orgName,
      generated,
      markedOverdue,
      dueThisWeek,
      overdue,
      missingEmail,
    });
    const sent = await sendEmail({ to: recipients, subject, html, from: fromEmail });
    if (sent.ok) digestSent = true;
    else errors.push(`digest: ${sent.error}`);
  }

  if (notify.whatsappReady && notify.internalWhatsApp.length > 0 && hasNews) {
    const body = collectionsDigestWhatsApp({
      orgName,
      generated,
      markedOverdue,
      overdue: overdue.map((r) => ({ company: r.company, amount: r.amount, dueDate: r.dueDate })),
      dueThisWeek: dueThisWeek.map((r) => ({
        company: r.company,
        amount: r.amount,
        dueDate: r.dueDate,
      })),
    });
    const wa = await sendWhatsApp({ to: notify.internalWhatsApp, body });
    if (wa.ok) digestWhatsAppSent = wa.sent > 0;
    else errors.push(`digest wa: ${wa.error}`);
  }

  return {
    generated,
    markedOverdue,
    remindersSent,
    whatsappRemindersSent,
    remindersSkippedNoContact,
    digestSent,
    digestWhatsAppSent,
    errors,
  };
}
