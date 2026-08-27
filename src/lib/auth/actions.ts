"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/monitoring/server";

export type LoginState = { error: string } | null;

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

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
