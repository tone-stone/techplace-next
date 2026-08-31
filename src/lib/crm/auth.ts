import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE, IDLE_TIMEOUT_MS } from "@/lib/auth/session";
import {
  canOpenDashboard,
  canReadBilling,
  canUseBlogModule,
  canUseCrmCore,
  canUseSupport,
  canWriteBilling,
  type ProfileRole,
  type Role,
} from "@/lib/auth/roles";

/**
 * Auth/permission gate for dashboard server actions. Every mutation calls one
 * of the `require*` helpers below before touching the database. Each also
 * enforces the shared inactivity-timeout window and slides it forward on
 * success, so a server action doubles as an activity ping.
 *
 * Not a "use server" file: these are only ever called from within other
 * server action files, never invoked directly from a client component.
 */

/**
 * Checks the inactivity window, loads the current user's role, and evaluates
 * `predicate` against it.
 *
 * @returns `{ ok: true, userId, role }` on success, or `{ ok: false, error }`
 * if the session is expired, unauthenticated, or lacks the required role.
 */
async function requireRole(predicate: (r: Role) => boolean, deniedMessage: string) {
  const cookieStore = await cookies();

  // Inactivity check — same window the proxy and the client timer use.
  const seenRaw = cookieStore.get(ACTIVITY_COOKIE)?.value;
  const seen = seenRaw ? Number(seenRaw) : NaN;
  if (Number.isFinite(seen) && Date.now() - seen > IDLE_TIMEOUT_MS) {
    return {
      ok: false as const,
      error: "Tu sesión expiró por inactividad. Vuelve a iniciar sesión.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
  const role = (profile as ProfileRole | null)?.role;
  if (!role || !predicate(role)) {
    return { ok: false as const, error: deniedMessage };
  }

  // Slide the inactivity window forward on every authenticated mutation.
  try {
    cookieStore.set(ACTIVITY_COOKIE, String(Date.now()), {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  } catch {
    // Read-only cookie context (RSC render) — the proxy refreshes it on the
    // next navigation instead.
  }

  return { ok: true as const, userId: user.id, email: user.email ?? null, role };
}

/** Any signed-in dashboard account (used by the Tareas actions). */
export function requireDashboard() {
  return requireRole(canOpenDashboard, "No tienes permisos para el panel");
}

/** Clientes / Proyectos / Cotizaciones create+update: dios, admin, ejecutivo. */
export function requireCrmCore() {
  return requireRole(canUseCrmCore, "No tienes permisos para esta sección del CRM");
}

/** Facturación writes: dios, admin only (ejecutivo is read-only). */
export function requireBillingWrite() {
  return requireRole(canWriteBilling, "Solo dios o admin pueden modificar Facturación");
}

/** Facturación reads. */
export function requireBillingRead() {
  return requireRole(canReadBilling, "No tienes permisos para Facturación");
}

/** Blog articles create/update/delete: dios, admin, blog, redactor. */
export function requireBlogContent() {
  return requireRole(canUseBlogModule, "No tienes permisos para el módulo de blog");
}

/** Soporte: Activos e IT Service Desk. dios, admin, ejecutivo. */
export function requireSupport() {
  return requireRole(canUseSupport, "No tienes permisos para el módulo de Soporte");
}
