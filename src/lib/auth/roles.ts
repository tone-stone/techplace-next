/**
 * Single source of truth for the permission model. Every account holds
 * exactly one flat role. All permission checks elsewhere (proxy.ts, server
 * actions, CRM helpers, dashboard nav) call into the predicates here instead
 * of re-deriving the logic. Kept dependency-free (no next/headers, no JSX)
 * so it's safe to import from both Node server code and src/proxy.ts (Edge).
 *
 *  - dios      full access, no restriction; only another dios may change or
 *              deactivate a dios account
 *  - admin     runs the whole CRM, assigns users/roles; cannot touch a dios
 *  - ejecutivo Clientes/Proyectos/Cotizaciones/Tareas full; Facturación
 *              read-only; no Monitoreo, no Usuarios
 *  - blog      Blog module (articles + blog-team accounts) and Tareas
 *  - redactor  Blog articles and Tareas only
 */

export const ROLES = ["dios", "admin", "ejecutivo", "blog", "redactor"] as const;
export type Role = (typeof ROLES)[number];

/** Shape of the `profiles` row as read for permission checks. */
export type ProfileRole = { role: Role };

const roleOf = (p: ProfileRole | Role): Role => (typeof p === "string" ? p : p.role);
const isOneOf =
  (...allowed: Role[]) =>
  (p: ProfileRole | Role) =>
    allowed.includes(roleOf(p));

/* --- Individual roles --- */
export const isDios = isOneOf("dios");
export const isAdmin = isOneOf("admin");
export const isEjecutivo = isOneOf("ejecutivo");
export const isBlog = isOneOf("blog");
export const isRedactor = isOneOf("redactor");

/* --- Capability sets --- */

/** Anyone with a valid role may open the `/admin` dashboard. */
export const canOpenDashboard = isOneOf(...ROLES);
/** Clientes, Proyectos, Cotizaciones (full CRUD). */
export const canUseCrmCore = isOneOf("dios", "admin", "ejecutivo");
/** See the Facturación module. */
export const canReadBilling = isOneOf("dios", "admin", "ejecutivo");
/** Create/edit/delete in Facturación (ejecutivo is read-only). */
export const canWriteBilling = isOneOf("dios", "admin");
/** Monitoreo module. */
export const canSeeMonitoring = isOneOf("dios", "admin");
/** Full account management (every role, every account except a dios for admin). */
export const canManageAllUsers = isOneOf("dios", "admin");
/** Blog-team account management (only blog/redactor accounts). */
export const canManageBlogUsers = isOneOf("dios", "admin", "blog");
/** See and edit blog articles. */
export const canUseBlogModule = isOneOf("dios", "admin", "blog", "redactor");
/** Delete a blog article — same set as editing them now. */
export const canDeleteArticles = isOneOf("dios", "admin", "blog", "redactor");
/** Tareas module — available to every role. */
export const canUseTasks = isOneOf(...ROLES);
/** Soporte: Activos e IT Service Desk (tickets). Same set as CRM core for now;
 *  split out if a dedicated `soporte` role is ever added. */
export const canUseSupport = isOneOf("dios", "admin", "ejecutivo");

/* --- Account-on-account rules --- */

/** Can `actor` create/edit/delete an account that has role `target`? */
export function canActOnAccount(actor: Role, target: Role): boolean {
  if (actor === "dios") return true;
  if (actor === "admin") return target !== "dios";
  if (actor === "blog") return target === "blog" || target === "redactor";
  return false;
}

/** Which roles may `actor` assign to an account. */
export function assignableRoles(actor: Role): Role[] {
  if (actor === "dios") return [...ROLES];
  if (actor === "admin") return ROLES.filter((r) => r !== "dios");
  if (actor === "blog") return ["blog", "redactor"];
  return [];
}
