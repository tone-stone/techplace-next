"use server";

/**
 * Server actions backing the CRM and blog login forms: `login()` verifies
 * credentials and that the account's team matches the portal it signed in
 * from, and `logout()` tears down the session. Both are called directly as
 * form actions from LoginForm.tsx and IdleTimeout.tsx.
 */

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/monitoring/server";
import { canAccessBlog, canAccessCrm, type ProfileRole } from "@/lib/auth/roles";

/**
 * Login form state. `otherPortalHref`/`otherPortalLabel` are set when the
 * credentials are valid but the account belongs to the other portal's team,
 * pointing the user at where they actually need to sign in.
 */
export type LoginState = {
  error: string;
  otherPortalHref?: string;
  otherPortalLabel?: string;
} | null;

/**
 * Signs in with email/password, then verifies the account's team can access
 * the portal (`crm` or `blog`, from the `portal` form field) it was submitted
 * from. A valid CRM account used at the blog login (or vice versa) is signed
 * back out and rejected with a link to its correct portal, rather than left
 * signed in on a portal proxy.ts would just redirect it away from anyway.
 * On success, redirects to `redirectTo`.
 */
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

/**
 * Signs out, clears the idle-timeout activity cookie, and redirects to
 * `redirectTo` (defaults to `/login`). Used both for a normal logout and by
 * IdleTimeout.tsx after an inactivity timeout, where `redirectTo` carries a
 * `?expired=1` query so the destination login page shows the expiry notice.
 */
export async function logout(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVITY_COOKIE);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
