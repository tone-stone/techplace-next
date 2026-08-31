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
};

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("org_name, billing_from_email, billing_reminder_lead_days")
    .eq("id", true)
    .maybeSingle();
  return {
    orgName: data?.org_name ?? "TechPlace",
    billingFromEmail: data?.billing_from_email ?? null,
    billingReminderLeadDays: data?.billing_reminder_lead_days ?? 3,
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

  if (!orgName) return { error: "El nombre de la organización es obligatorio" };
  if (billingFromEmail && !billingFromEmail.includes("@")) {
    return { error: "El correo remitente no es válido" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      org_name: orgName,
      billing_from_email: billingFromEmail || null,
      billing_reminder_lead_days: leadDays,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
