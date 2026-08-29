"use server";

/**
 * Server actions backing the single login form: `login()` verifies
 * credentials and that the account has a dashboard role, and `logout()` tears
 * down the session. Both are called directly as form actions from
 * LoginForm.tsx and IdleTimeout.tsx.
 */

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/monitoring/server";
import { canOpenDashboard, type ProfileRole } from "@/lib/auth/roles";

/** Login form state — an error message, or `null` before the first attempt. */
export type LoginState = { error: string } | null;

/**
 * Signs in with email/password, then verifies the account has a valid
 * dashboard role. An account with no profile / no role is signed back out
 * and rejected. On success, redirects to `redirectTo` (default `/admin`).
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");

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
        path: "/login",
        meta: { email, ip: ip ?? null },
      });
    });
    return { error: "Email o contraseña incorrectos" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile || !canOpenDashboard(profile as ProfileRole)) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no tiene acceso al panel. Contacta a un administrador." };
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
