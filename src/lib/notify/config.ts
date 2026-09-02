/**
 * Shared read of the notification settings on the single `app_settings` row,
 * used by both the cobranza / agenda crons (service-role client) and the
 * real-time quote actions (RLS client). Pure module — no `"use server"` — so
 * it can be imported from either context. Resilient to migration 0035 not
 * being applied yet: a missing column just falls back to its default.
 *
 * The caller passes a `fetchRow(cols)` that runs
 * `app_settings.select(cols).eq("id", true).maybeSingle()` on whichever client
 * it holds, so this module stays free of Supabase types.
 */

import { whatsappConfigured, parseRecipientList } from "@/lib/whatsapp/client";

export type NotifySettings = {
  orgName: string;
  fromEmail: string | undefined;
  /** WhatsApp is actually usable: admin toggled it on AND the Twilio env vars exist. */
  whatsappReady: boolean;
  /** `whatsapp:+…` addresses that receive internal alerts (digest, quote accepted, agenda). */
  internalWhatsApp: string[];
  /** Extra email addresses that receive internal alerts, on top of the dios/admin profiles. */
  internalEmail: string[];
  billingReminderLeadDays: number;
  agendaReminderLeadDays: number;
};

// Fallback tiers so a partially-applied set of migrations still reads cleanly:
// everything (0036) → the 0035 set → the original always-present columns.
const FULL_COLS =
  "org_name, billing_from_email, billing_reminder_lead_days, notify_whatsapp_enabled, notify_internal_whatsapp, agenda_reminder_lead_days, notify_internal_email";
const V35_COLS =
  "org_name, billing_from_email, billing_reminder_lead_days, notify_whatsapp_enabled, notify_internal_whatsapp, agenda_reminder_lead_days";
const BASE_COLS = "org_name, billing_from_email, billing_reminder_lead_days";

type FetchRow = (cols: string) => Promise<Record<string, unknown> | null>;

/** Splits a free-text list of emails (comma / semicolon / newline separated). */
export function parseEmailList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(/[\n,;]+/)) {
    const e = part.trim().toLowerCase();
    if (e && !/\s/.test(e) && e.includes("@")) seen.add(e);
  }
  return [...seen];
}

/** Loads notification settings; never throws — worst case returns the defaults. */
export async function readNotifySettings(fetchRow: FetchRow): Promise<NotifySettings> {
  let row: Record<string, unknown> | null = null;
  for (const cols of [FULL_COLS, V35_COLS, BASE_COLS]) {
    try {
      row = await fetchRow(cols);
    } catch {
      row = null;
    }
    if (row) break;
  }

  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    orgName: (row?.org_name as string) || "TechPlace",
    fromEmail: (row?.billing_from_email as string) || undefined,
    whatsappReady: row?.notify_whatsapp_enabled === true && whatsappConfigured(),
    internalWhatsApp: parseRecipientList(row?.notify_internal_whatsapp as string | null | undefined),
    internalEmail: parseEmailList(row?.notify_internal_email as string | null | undefined),
    billingReminderLeadDays: num(row?.billing_reminder_lead_days, 3),
    agendaReminderLeadDays: num(row?.agenda_reminder_lead_days, 2),
  };
}
