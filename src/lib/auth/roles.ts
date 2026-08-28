/**
 * Single source of truth for the team/role permission model. Every account
 * belongs to exactly one team (`crm` | `blog`) and holds exactly one role
 * within that team, giving four valid (team, role) combos in total:
 * `(crm,admin)`, `(crm,operativo)`, `(blog,admin)`, `(blog,redactor)`. All
 * permission checks elsewhere in the app (proxy.ts, server actions, CRM
 * helpers) call into the predicate functions here instead of re-deriving
 * this logic. Kept dependency-free (no next/headers, no JSX) so it's safe
 * to import from both Node server code and src/proxy.ts (Edge runtime).
 */

export type Team = "crm" | "blog";
export type Role = "admin" | "operativo" | "redactor";
export type ProfileRole = { team: Team; role: Role };

/** True for the `(crm,admin)` combo — the app's general admin. */
export const isCrmAdmin = (p: ProfileRole) => p.team === "crm" && p.role === "admin";
/** True for the `(crm,operativo)` combo. */
export const isCrmOperativo = (p: ProfileRole) => p.team === "crm" && p.role === "operativo";
/** True for the `(blog,admin)` combo. */
export const isBlogAdmin = (p: ProfileRole) => p.team === "blog" && p.role === "admin";
/** True for the `(blog,redactor)` combo. */
export const isBlogRedactor = (p: ProfileRole) => p.team === "blog" && p.role === "redactor";

// CRM admin is the app's general admin — full access everywhere, including
// the blog, on top of running the CRM itself and assigning every account.
/** Gate for the CRM portal: crm/admin and crm/operativo, plus the general admin. */
export const canAccessCrm = (p: ProfileRole) => isCrmAdmin(p) || isCrmOperativo(p);
/** Gate for the blog portal: blog/admin and blog/redactor, plus the general admin. */
export const canAccessBlog = (p: ProfileRole) => isCrmAdmin(p) || isBlogAdmin(p) || isBlogRedactor(p);
/** Gate for the CRM's user management panel (create/edit/delete accounts). */
export const canManageUsers = (p: ProfileRole) => isCrmAdmin(p);
/** Gate for destructive CRM data operations. */
export const canDeleteCrmData = (p: ProfileRole) => isCrmAdmin(p);
/** Gate for deleting blog articles: CRM admin or blog admin, not redactor. */
export const canDeleteArticles = (p: ProfileRole) => isCrmAdmin(p) || isBlogAdmin(p);
/** Gate for rendering blog-admin-only UI (visible to the general admin too). */
export const showsBlogAdminView = (p: ProfileRole) => isCrmAdmin(p) || isBlogAdmin(p);
