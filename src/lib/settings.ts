"use server";

/**
 * Organization settings — the single `app_settings` row (org name, the "from"
 * address and reminder window used by the cobranza cron). Read by any dashboard
 * account; only dios/admin can save (see `requireSettings`). When multi-tenant
 * lands this becomes one row per org (see supabase/README.md).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSettings } from "@/lib/crm/auth";
import type { CrmActionState } from "@/lib/crm/clients";

export type AppSettings = {
  orgName: string;
  billingFromEmail: string | null;
  billingReminderLeadDays: number;
  /** Send cobranza / quote / agenda notices over WhatsApp too (needs Twilio env vars). */
  notifyWhatsappEnabled: boolean;
  /** Free-text list of numbers for internal WhatsApp alerts (comma/newline separated). */
  notifyInternalWhatsapp: string;
  /** Free-text list of extra emails for internal alerts, on top of the dios/admin profiles. */
  notifyInternalEmail: string;
  /** Days ahead the daily agenda digest looks for due tasks/projects/SLAs. */
  agendaReminderLeadDays: number;
};

const FULL_COLS =
  "org_name, billing_from_email, billing_reminder_lead_days, notify_whatsapp_enabled, notify_internal_whatsapp, agenda_reminder_lead_days, notify_internal_email";
const V35_COLS =
  "org_name, billing_from_email, billing_reminder_lead_days, notify_whatsapp_enabled, notify_internal_whatsapp, agenda_reminder_lead_days";
const BASE_COLS = "org_name, billing_from_email, billing_reminder_lead_days";

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  // Fall back through migration tiers (0036 → 0035 → base) so a partial apply still reads.
  let data: Record<string, unknown> | null = null;
  for (const cols of [FULL_COLS, V35_COLS, BASE_COLS]) {
    const res = await supabase.from("app_settings").select(cols).eq("id", true).maybeSingle();
    if (res.data) {
      data = res.data as unknown as Record<string, unknown>;
      break;
    }
  }
  const d = data ?? {};
  return {
    orgName: (d.org_name as string) ?? "TechPlace",
    billingFromEmail: (d.billing_from_email as string | null) ?? null,
    billingReminderLeadDays: Number(d.billing_reminder_lead_days ?? 3),
    notifyWhatsappEnabled: d.notify_whatsapp_enabled === true,
    notifyInternalWhatsapp: (d.notify_internal_whatsapp as string | null) ?? "",
    notifyInternalEmail: (d.notify_internal_email as string | null) ?? "",
    agendaReminderLeadDays: Number(d.agenda_reminder_lead_days ?? 2),
  };
}

/** `useActionState` action backing the Configuración form. */
export async function updateAppSettingsAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireSettings();
  if (!check.ok) return { error: check.error };

  const orgName = String(formData.get("orgName") ?? "").trim();
  const billingFromEmail = String(formData.get("billingFromEmail") ?? "").trim();
  const leadRaw = Number(formData.get("billingReminderLeadDays") ?? 3);
  const leadDays = Number.isFinite(leadRaw) ? Math.max(0, Math.min(60, Math.round(leadRaw))) : 3;
  const notifyWhatsapp = formData.get("notifyWhatsappEnabled") === "on";
  const internalWhatsapp = String(formData.get("notifyInternalWhatsapp") ?? "").trim();
  const internalEmail = String(formData.get("notifyInternalEmail") ?? "").trim();
  const agendaRaw = Number(formData.get("agendaReminderLeadDays") ?? 2);
  const agendaDays = Number.isFinite(agendaRaw) ? Math.max(0, Math.min(30, Math.round(agendaRaw))) : 2;

  if (!orgName) return { error: "El nombre de la organización es obligatorio" };
  if (billingFromEmail && !billingFromEmail.includes("@")) {
    return { error: "El correo remitente no es válido" };
  }

  const supabase = await createClient();
  const base = {
    org_name: orgName,
    billing_from_email: billingFromEmail || null,
    billing_reminder_lead_days: leadDays,
  };
  const v35 = {
    ...base,
    notify_whatsapp_enabled: notifyWhatsapp,
    notify_internal_whatsapp: internalWhatsapp || null,
    agenda_reminder_lead_days: agendaDays,
  };
  let { error } = await supabase
    .from("app_settings")
    .update({ ...v35, notify_internal_email: internalEmail || null })
    .eq("id", true);
  if (error && /column .*notify_internal_email.* does not exist/i.test(error.message)) {
    // Migration 0036 pending — save the 0035 fields, drop the new email list.
    ({ error } = await supabase.from("app_settings").update(v35).eq("id", true));
    if (!error) {
      revalidatePath("/admin");
      return { error: "Se guardó todo menos los correos internos. Aplica la migración 0036." };
    }
  }
  if (
    error &&
    /column .*(notify_whatsapp_enabled|notify_internal_whatsapp|agenda_reminder_lead_days).* does not exist/i.test(
      error.message
    )
  ) {
    ({ error } = await supabase.from("app_settings").update(base).eq("id", true)); // migration 0035 pending
    if (!error) {
      revalidatePath("/admin");
      return { error: "Se guardó lo básico. Aplica las migraciones 0035 y 0036 para las notificaciones." };
    }
  }

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
