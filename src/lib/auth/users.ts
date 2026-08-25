"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "redactor";
};

export type UsersActionState = { error: string } | { success: true } | null;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    return { ok: false as const, error: "Solo un administrador puede hacer esto" };
  }

  return { ok: true as const, userId: user.id };
}

export async function listUsers(): Promise<{ users: ManagedUser[] } | { error: string }> {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const admin = createAdminClient();
  const [{ data: authData, error: authError }, { data: profiles, error: profilesError }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from("profiles").select("id, role"),
  ]);

  if (authError) return { error: authError.message };
  if (profilesError) return { error: profilesError.message };

  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role as "admin" | "redactor"]));

  const users: ManagedUser[] = authData.users.map((u) => ({
    id: u.id,
    name: (u.user_metadata?.full_name as string | undefined) || u.email?.split("@")[0] || "Sin nombre",
    email: u.email ?? "",
    role: roleById.get(u.id) ?? "redactor",
  }));

  users.sort((a, b) => a.name.localeCompare(b.name));

  return { users };
}

export async function createUserAction(_prevState: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "redactor") as "admin" | "redactor";

  if (!name || !email || !password) {
    return { error: "Completa nombre, email y contraseña" };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error) return { error: error.message };

  if (role === "admin" && data.user) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", data.user.id);
    if (profileError) return { error: profileError.message };
  }

  return { success: true };
}

export async function updateUserAction(_prevState: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "redactor") as "admin" | "redactor";
  const password = String(formData.get("password") ?? "");

  if (!id || !name || !email) {
    return { error: "Completa nombre y email" };
  }

  const admin = createAdminClient();

  const authUpdate: { email?: string; password?: string; user_metadata: { full_name: string } } = {
    email,
    user_metadata: { full_name: name },
  };
  if (password) {
    if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" };
    authUpdate.password = password;
  }

  const { error: authError } = await admin.auth.admin.updateUserById(id, authUpdate);
  if (authError) return { error: authError.message };

  const isSelf = id === check.userId;
  const { error: profileError } = await admin
    .from("profiles")
    .update({ email, ...(isSelf ? {} : { role }) })
    .eq("id", id);
  if (profileError) return { error: profileError.message };

  return { success: true };
}

export async function deleteUserAction(id: string): Promise<UsersActionState> {
  const check = await requireAdmin();
  if (!check.ok) return { error: check.error };
  if (id === check.userId) return { error: "No puedes eliminar tu propia cuenta" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  return { success: true };
}
