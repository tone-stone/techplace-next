"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/monitoring/server";
import { canAccessBlog, canAccessCrm, type ProfileRole } from "@/lib/auth/roles";

export type LoginState = {
  error: string;
  otherPortalHref?: string;
  otherPortalLabel?: string;
} | null;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");
  const portal = formData.get("portal") === "blog" ? "blog" : "crm";

  if (!email || !password) {
    return { error: "Por favor ingresa email y contraseña" };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    after(async () => {
      const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
      await logSecurityEvent({
        message: "Intento de login fallido",
        path: portal === "crm" ? "/login" : "/blog/login",
        meta: { email, ip: ip ?? null },
      });
    });
    return { error: "Email o contraseña incorrectos" };
  }

  // Credentials are valid, but this account might belong to the other team —
  // e.g. a redactor account signing in at the CRM login. Reject with a link
  // to where the account actually belongs instead of leaving them signed in
  // on a portal proxy.ts is just going to bounce them out of anyway.
  const { data: profile } = await supabase
    .from("profiles")
    .select("team, role")
    .eq("id", data.user.id)
    .single();

  const hasAccess = portal === "crm" ? canAccessCrm : canAccessBlog;

  if (!profile || !hasAccess(profile as ProfileRole)) {
    await supabase.auth.signOut();

    if (!profile) {
      return { error: "Tu cuenta no tiene un equipo asignado. Contacta a un administrador." };
    }

    return portal === "crm"
      ? {
          error: "Esta cuenta es del equipo de redacción — no tiene acceso al CRM.",
          otherPortalHref: "/blog/login",
          otherPortalLabel: "Ir al portal de redacción",
        }
      : {
          error: "Esta cuenta es del CRM — no tiene acceso al portal de redacción.",
          otherPortalHref: "/login",
          otherPortalLabel: "Ir al panel de administración",
        };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function logout(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVITY_COOKIE);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
