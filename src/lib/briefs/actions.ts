"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canUseCrmCore, type Role } from "@/lib/auth/roles";
import { readNotifySettings } from "@/lib/notify/config";
import { sendEmail } from "@/lib/email/client";
import { sendWhatsApp } from "@/lib/whatsapp/client";
import { newBriefEmail } from "@/lib/email/templates";
import { newBriefWhatsApp } from "@/lib/notify/messages";
import type { BriefState, BriefStatus, ManagedBrief } from "@/lib/briefs/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

const OTHER = "Otro";

/** Reads a select field that offers an "Otro" option backed by a sibling `${key}_other` text input. */
function strOrOther(formData: FormData, key: string): string {
  const value = str(formData, key);
  if (value !== OTHER) return value;
  return str(formData, `${key}_other`) || OTHER;
}

export async function submitProjectBrief(_prevState: BriefState, formData: FormData): Promise<BriefState> {
  const fullName = str(formData, "full_name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const projectType = str(formData, "project_type");
  const projectGoal = str(formData, "project_goal");
  const budgetRange = str(formData, "budget_range");
  const timeline = str(formData, "timeline");

  if (!fullName || !email || !phone || !projectType || !projectGoal || !budgetRange || !timeline) {
    return { success: false, message: "Por favor completa todos los campos obligatorios (*) antes de enviar." };
  }

  if (!EMAIL_RE.test(email)) {
    return { success: false, message: "Ese email no parece válido, revísalo por favor." };
  }

  const hasWebsite = str(formData, "has_website") === "Sí";
  const features = formData.getAll("features").map(String);
  const integrations = formData.getAll("integrations").map(String);

  const brief = {
    full_name: fullName,
    business_name: str(formData, "business_name") || null,
    email,
    phone,
    lead_source: strOrOther(formData, "lead_source") || null,
    industry: strOrOther(formData, "industry") || null,
    has_website: hasWebsite,
    current_website_url: hasWebsite ? str(formData, "current_website_url") || null : null,

    project_type: projectType,
    system_type: str(formData, "system_type") || null,
    project_goal: projectGoal,
    target_audience: str(formData, "target_audience") || null,
    problem_to_solve: str(formData, "problem_to_solve") || null,

    pages_estimate: str(formData, "pages_estimate") || null,
    features,
    payment_gateway: strOrOther(formData, "payment_gateway") || null,
    integrations,

    has_branding: str(formData, "has_branding") || null,
    reference_sites: str(formData, "reference_sites") || null,
    content_ready: str(formData, "content_ready") || null,
    visual_style: str(formData, "visual_style") || null,

    has_domain_hosting: str(formData, "has_domain_hosting") || null,
    tech_preference: strOrOther(formData, "tech_preference") || null,
    needs_maintenance: str(formData, "needs_maintenance") || null,

    budget_range: budgetRange,
    timeline,
    additional_notes: str(formData, "additional_notes") || null,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("project_briefs").insert(brief);

  if (error) {
    console.error("submitProjectBrief: fallo al guardar en Supabase", error);
    return {
      success: false,
      message: "No pudimos guardar tu información. Intenta de nuevo o escríbenos por WhatsApp.",
    };
  }

  try {
    await notifyNewBrief(brief);
  } catch (err) {
    // La respuesta ya quedó guardada en Supabase; la notificación al equipo es best-effort.
    console.error("submitProjectBrief: fallo al notificar al equipo", err);
  }

  return {
    success: true,
    message: "¡Gracias! Recibimos tu brief. Te contactaremos pronto con una cotización a la medida.",
  };
}

/**
 * Internal alert (email + WhatsApp) to dios/admin the moment a lead comes in
 * through the public form — before this, the team only found out by opening
 * the panel. Runs with the service-role client since the submitter has no
 * session/permissions to read `app_settings` or `profiles`. Best-effort: the
 * caller swallows failures so a notification hiccup never fails the submission.
 */
async function notifyNewBrief(brief: {
  full_name: string;
  business_name: string | null;
  email: string;
  phone: string;
  lead_source: string | null;
  project_type: string;
  budget_range: string;
  timeline: string;
}): Promise<void> {
  const admin = createAdminClient();
  const notify = await readNotifySettings(async (cols) => {
    const { data } = await admin.from("app_settings").select(cols).eq("id", true).maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  });

  const { data: staff } = await admin
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
    const { subject, html } = newBriefEmail({
      orgName: notify.orgName,
      fullName: brief.full_name,
      businessName: brief.business_name,
      email: brief.email,
      phone: brief.phone,
      leadSource: brief.lead_source,
      projectType: brief.project_type,
      budgetRange: brief.budget_range,
      timeline: brief.timeline,
    });
    await sendEmail({ to: recipients, subject, html, from: notify.fromEmail });
  }

  if (notify.whatsappReady && notify.internalWhatsApp.length > 0) {
    await sendWhatsApp({
      to: notify.internalWhatsApp,
      body: newBriefWhatsApp({
        orgName: notify.orgName,
        fullName: brief.full_name,
        businessName: brief.business_name,
        leadSource: brief.lead_source,
        projectType: brief.project_type,
        budgetRange: brief.budget_range,
        phone: brief.phone,
      }),
    });
  }
}

async function requireCrmStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();
  if (!profile) return { ok: false as const, error: "No tienes un perfil de equipo asociado" };

  const role = profile.role as Role;
  if (!canUseCrmCore(role)) return { ok: false as const, error: "No tienes permiso para ver cotizaciones" };

  return { ok: true as const, role };
}

function mapBriefRow(row: {
  id: string;
  created_at: string;
  status: BriefStatus;
  full_name: string;
  business_name: string | null;
  email: string;
  phone: string;
  lead_source: string | null;
  industry: string | null;
  has_website: boolean;
  current_website_url: string | null;
  project_type: string;
  system_type: string | null;
  project_goal: string;
  target_audience: string | null;
  problem_to_solve: string | null;
  pages_estimate: string | null;
  features: string[] | null;
  payment_gateway: string | null;
  integrations: string[] | null;
  has_branding: string | null;
  reference_sites: string | null;
  content_ready: string | null;
  visual_style: string | null;
  has_domain_hosting: string | null;
  tech_preference: string | null;
  needs_maintenance: string | null;
  budget_range: string;
  timeline: string;
  additional_notes: string | null;
}): ManagedBrief {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    fullName: row.full_name,
    businessName: row.business_name,
    email: row.email,
    phone: row.phone,
    leadSource: row.lead_source,
    industry: row.industry,
    hasWebsite: row.has_website,
    currentWebsiteUrl: row.current_website_url,
    projectType: row.project_type,
    systemType: row.system_type,
    projectGoal: row.project_goal,
    targetAudience: row.target_audience,
    problemToSolve: row.problem_to_solve,
    pagesEstimate: row.pages_estimate,
    features: row.features ?? [],
    paymentGateway: row.payment_gateway,
    integrations: row.integrations ?? [],
    hasBranding: row.has_branding,
    referenceSites: row.reference_sites,
    contentReady: row.content_ready,
    visualStyle: row.visual_style,
    hasDomainHosting: row.has_domain_hosting,
    techPreference: row.tech_preference,
    needsMaintenance: row.needs_maintenance,
    budgetRange: row.budget_range,
    timeline: row.timeline,
    additionalNotes: row.additional_notes,
  };
}

export async function listProjectBriefs(): Promise<{ briefs: ManagedBrief[] } | { error: string }> {
  const check = await requireCrmStaff();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_briefs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { briefs: (data ?? []).map(mapBriefRow) };
}

export async function updateBriefStatusAction(
  id: string,
  status: BriefStatus
): Promise<{ error: string } | { success: true }> {
  const check = await requireCrmStaff();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("project_briefs").update({ status }).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
