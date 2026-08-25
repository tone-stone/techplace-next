"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | null;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");
  const requiredRole = formData.get("requiredRole") ? String(formData.get("requiredRole")) : null;

  if (!email || !password) {
    return { error: "Por favor ingresa email y contraseña" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos" };
  }

  if (requiredRole && data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== requiredRole) {
      await supabase.auth.signOut();
      return {
        error:
          requiredRole === "admin"
            ? "Esta cuenta no tiene permisos de administrador."
            : "Esta cuenta no tiene permisos de redactor.",
      };
    }
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function logout(formData?: FormData) {
  const redirectTo = String(formData?.get("redirectTo") ?? "/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
