"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withTiming } from "@/lib/monitoring/timing";
import { isBlogAdmin, isCrmAdmin, type ProfileRole, type Role, type Team } from "@/lib/auth/roles";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  team: Team;
  role: Role;
};

export type UsersActionState = { error: string } | { success: true } | null;

// (team, role) combos the profiles_team_role_check constraint allows.
const VALID_COMBOS: Record<Team, Role[]> = {
  crm: ["admin", "operativo"],
  blog: ["admin", "redactor"],
};

function parseTeamRole(formData: FormData): { team: Team; role: Role } | { error: string } {
  const team = String(formData.get("team") ?? "") as Team;
  const role = String(formData.get("role") ?? "") as Role;
  if (!VALID_COMBOS[team]?.includes(role)) {
    return { error: "Combinación de equipo y rol inválida" };
  }
  return { team, role };
}

// CRM admin manages every account (it's the app's general admin). Blog admin
// manages only its own team's accounts — it can't reach into or promote
// someone into the CRM.
async function requireUserManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("team, role").eq("id", user.id).single();
  if (!profile) return { ok: false as const, error: "No tienes permisos para hacer esto" };

  const p = profile as ProfileRole;
  if (isCrmAdmin(p)) return { ok: true as const, userId: user.id, scope: "all" as const };
  if (isBlogAdmin(p)) return { ok: true as const, userId: user.id, scope: "blog" as const };

  return { ok: false as const, error: "No tienes permisos para hacer esto" };
}

export async function listUsers(): Promise<{ users: ManagedUser[] } | { error: string }> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };

  const admin = createAdminClient();
  const [{ data: authData, error: authError }, { data: profiles, error: profilesError }] = await withTiming(
    "auth.listUsers",
    () =>
      Promise.all([admin.auth.admin.listUsers(), admin.from("profiles").select("id, team, role")])
  );

  if (authError) return { error: authError.message };
  if (profilesError) return { error: profilesError.message };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  let users: ManagedUser[] = authData.users.map((u) => {
    const profile = profileById.get(u.id);
    return {
      id: u.id,
      name: (u.user_metadata?.full_name as string | undefined) || u.email?.split("@")[0] || "Sin nombre",
      email: u.email ?? "",
      team: (profile?.team as Team) ?? "blog",
      role: (profile?.role as Role) ?? "redactor",
    };
  });

  if (check.scope === "blog") {
    users = users.filter((u) => u.team === "blog");
  }

  users.sort((a, b) => a.name.localeCompare(b.name));

  return { users };
}

export async function createUserAction(_prevState: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const teamRole = parseTeamRole(formData);

  if (!name || !email || !password) {
    return { error: "Completa nombre, email y contraseña" };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" };
  }
  if ("error" in teamRole) return teamRole;
  if (check.scope === "blog" && teamRole.team !== "blog") {
    return { error: "Solo puedes crear cuentas del equipo de blog" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error) return { error: error.message };

  if (data.user) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({ team: teamRole.team, role: teamRole.role })
      .eq("id", data.user.id);
    if (profileError) return { error: profileError.message };
  }

  return { success: true };
}

export async function updateUserAction(_prevState: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const teamRole = parseTeamRole(formData);

  if (!id || !name || !email) {
    return { error: "Completa nombre y email" };
  }
  if ("error" in teamRole) return teamRole;
  if (check.scope === "blog" && teamRole.team !== "blog") {
    return { error: "Solo puedes asignar cuentas al equipo de blog" };
  }

  const admin = createAdminClient();

  if (check.scope === "blog") {
    const { data: target } = await admin.from("profiles").select("team").eq("id", id).single();
    if (target?.team !== "blog") {
      return { error: "Solo puedes editar cuentas del equipo de blog" };
    }
  }

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
    .update({ email, ...(isSelf ? {} : { team: teamRole.team, role: teamRole.role }) })
    .eq("id", id);
  if (profileError) return { error: profileError.message };

  return { success: true };
}

export async function deleteUserAction(id: string): Promise<UsersActionState> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };
  if (id === check.userId) return { error: "No puedes eliminar tu propia cuenta" };

  const admin = createAdminClient();

  if (check.scope === "blog") {
    const { data: target } = await admin.from("profiles").select("team").eq("id", id).single();
    if (target?.team !== "blog") {
      return { error: "Solo puedes eliminar cuentas del equipo de blog" };
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: error.message };

  return { success: true };
}
