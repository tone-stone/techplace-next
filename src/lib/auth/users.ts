"use server";

/**
 * Server actions for account management (list/create/update/delete), used by
 * the CRM's Usuarios tab (scope "all") and the Blog module's "Usuarios del
 * blog" sub-panel (scope "blog"). Access is gated by `requireUserManager()`:
 * `dios`/`admin` manage every account, `blog` manages only `blog`/`redactor`
 * accounts. A `dios` account can only be created, edited, or removed by
 * another `dios` (`canActOnAccount`).
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withTiming } from "@/lib/monitoring/timing";
import {
  assignableRoles,
  canActOnAccount,
  canManageAllUsers,
  canManageBlogUsers,
  canOpenDashboard,
  type ProfileRole,
  type Role,
} from "@/lib/auth/roles";

/** A user as shown/edited in the account management UI. */
export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Minimal account shape for the Tareas assignee picker. */
export type AssignableUser = { id: string; name: string };

export type UsersActionState = { error: string } | { success: true } | null;

const BLOG_SCOPE_ROLES: Role[] = ["blog", "redactor"];

/**
 * Authenticates the caller and resolves their user-management scope.
 * @returns `{ ok: false, error }` if unauthenticated or not a manager;
 * otherwise `{ ok: true, userId, actorRole, scope }` — `"all"` for
 * dios/admin, `"blog"` for the `blog` role.
 */
async function requireUserManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
  const actorRole = (profile as ProfileRole | null)?.role;
  if (!actorRole) return { ok: false as const, error: "No tienes permisos para hacer esto" };

  if (canManageAllUsers(actorRole)) {
    return { ok: true as const, userId: user.id, actorRole, scope: "all" as const };
  }
  if (canManageBlogUsers(actorRole)) {
    return { ok: true as const, userId: user.id, actorRole, scope: "blog" as const };
  }
  return { ok: false as const, error: "No tienes permisos para hacer esto" };
}

/** Narrows a caller's scope to "blog" when the panel calling in is blog-only. */
function resolveScope(callerScope: "all" | "blog", blogOnly: boolean): "all" | "blog" {
  return blogOnly ? "blog" : callerScope;
}

/** Validates the requested role against what `actorRole` may assign in `scope`. */
function parseRole(
  formData: FormData,
  actorRole: Role,
  scope: "all" | "blog"
): { role: Role } | { error: string } {
  const role = String(formData.get("role") ?? "") as Role;
  const allowed = assignableRoles(actorRole).filter(
    (r) => scope === "all" || BLOG_SCOPE_ROLES.includes(r)
  );
  if (!allowed.includes(role)) return { error: "Rol no válido para tu nivel de acceso" };
  return { role };
}

/**
 * Lists managed accounts, merging Supabase auth users with their `profiles` role.
 * @param opts.blogOnly - Force blog-only scope, for the "Usuarios del blog" sub-panel.
 */
export async function listUsers(opts?: { blogOnly?: boolean }): Promise<{ users: ManagedUser[] } | { error: string }> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };

  const scope = resolveScope(check.scope, opts?.blogOnly ?? false);

  const admin = createAdminClient();
  const [{ data: authData, error: authError }, { data: profiles, error: profilesError }] = await withTiming(
    "auth.listUsers",
    () => Promise.all([admin.auth.admin.listUsers(), admin.from("profiles").select("id, role").is("deleted_at", null)])
  );

  if (authError) return { error: authError.message };
  if (profilesError) return { error: profilesError.message };

  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role as Role]));

  let users: ManagedUser[] = authData.users.map((u) => ({
    id: u.id,
    name: (u.user_metadata?.full_name as string | undefined) || u.email?.split("@")[0] || "Sin nombre",
    email: u.email ?? "",
    role: roleById.get(u.id) ?? "redactor",
  }));

  if (scope === "blog") {
    users = users.filter((u) => BLOG_SCOPE_ROLES.includes(u.role));
  }

  users.sort((a, b) => a.name.localeCompare(b.name));

  return { users };
}

/** Reads the target account's current role via the admin client (bypasses RLS). */
async function targetRole(admin: ReturnType<typeof createAdminClient>, id: string): Promise<Role | null> {
  const { data } = await admin.from("profiles").select("role").eq("id", id).single();
  return (data?.role as Role | undefined) ?? null;
}

/** Creates a new account (Supabase auth user + profile role). Form action. */
export async function createUserAction(_prevState: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };

  const scope = resolveScope(check.scope, formData.get("panel") === "blog");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const parsed = parseRole(formData, check.actorRole, scope);

  if (!name || !email || !password) return { error: "Completa nombre, email y contraseña" };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres" };
  if ("error" in parsed) return parsed;

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
      .update({ role: parsed.role })
      .eq("id", data.user.id);
    if (profileError) return { error: profileError.message };
  }

  return { success: true };
}

/**
 * Updates an existing account's auth credentials and profile role. Form
 * action. A manager editing their own account keeps their existing role.
 */
export async function updateUserAction(_prevState: UsersActionState, formData: FormData): Promise<UsersActionState> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };

  const scope = resolveScope(check.scope, formData.get("panel") === "blog");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const parsed = parseRole(formData, check.actorRole, scope);

  if (!id || !name || !email) return { error: "Completa nombre y email" };
  if ("error" in parsed) return parsed;

  const admin = createAdminClient();
  const current = await targetRole(admin, id);
  if (!current) return { error: "La cuenta no existe" };
  if (!canActOnAccount(check.actorRole, current)) {
    return { error: "No puedes modificar esta cuenta" };
  }
  if (scope === "blog" && !BLOG_SCOPE_ROLES.includes(current)) {
    return { error: "Solo puedes editar cuentas de blog o redactor" };
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
    .update({ email, ...(isSelf ? {} : { role: parsed.role }) })
    .eq("id", id);
  if (profileError) return { error: profileError.message };

  return { success: true };
}

/**
 * Deletes an account. A manager can't delete their own account, and a `dios`
 * account can only be removed by another `dios`.
 * @param opts.blogOnly - Force blog-only scope, for the "Usuarios del blog" sub-panel.
 */
export async function deleteUserAction(id: string, opts?: { blogOnly?: boolean }): Promise<UsersActionState> {
  const check = await requireUserManager();
  if (!check.ok) return { error: check.error };
  if (id === check.userId) return { error: "No puedes eliminar tu propia cuenta" };

  const scope = resolveScope(check.scope, opts?.blogOnly ?? false);
  const admin = createAdminClient();

  const current = await targetRole(admin, id);
  if (!current) return { error: "La cuenta no existe" };
  if (!canActOnAccount(check.actorRole, current)) {
    return { error: "No puedes eliminar esta cuenta" };
  }
  if (scope === "blog" && !BLOG_SCOPE_ROLES.includes(current)) {
    return { error: "Solo puedes eliminar cuentas de blog o redactor" };
  }

  // Soft delete: the auth user and its profile stay in the DB. We mark the
  // profile `deleted_at` (which `current_role_name()` and every gate filter
  // out) and ban the login, and snapshot it to `deletion_log`. Recoverable
  // from Monitoreo → Eliminaciones.
  const { data: snapshot } = await admin.from("profiles").select("*").eq("id", id).single();

  const { error: updErr } = await admin
    .from("profiles")
    .update({ deleted_at: new Date().toISOString(), deleted_by: check.userId })
    .eq("id", id);
  if (updErr) return { error: updErr.message };

  await admin.from("deletion_log").insert({
    table_name: "profiles",
    record_id: id,
    snapshot: snapshot ?? { id },
    deleted_by: check.userId,
  });

  const { error: banErr } = await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  if (banErr) return { error: banErr.message };

  return { success: true };
}

/**
 * Accounts the signed-in user may assign a task to, in the Tareas module.
 * dios/admin/ejecutivo see every account; `blog` sees blog + redactor;
 * `redactor` gets an empty list (they can still self-assign in the UI).
 */
export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
  const role = (profile as ProfileRole | null)?.role;
  if (!role || !canOpenDashboard(role)) return [];

  const admin = createAdminClient();
  const [{ data: authData }, { data: profiles }] = await withTiming("auth.getAssignableUsers", () =>
    Promise.all([admin.auth.admin.listUsers(), admin.from("profiles").select("id, role").is("deleted_at", null)])
  );
  if (!authData) return [];

  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role as Role]));
  const allowedRoles: Role[] =
    role === "blog" ? ["blog", "redactor"] : role === "redactor" ? [] : [...assignableRoles("dios")];

  return authData.users
    .filter((u) => allowedRoles.includes(roleById.get(u.id) ?? "redactor"))
    .map((u) => ({
      id: u.id,
      name: (u.user_metadata?.full_name as string | undefined) || u.email?.split("@")[0] || "Sin nombre",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
