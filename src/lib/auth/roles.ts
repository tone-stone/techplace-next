// Single source of truth for the team/role permission model. Kept dependency-free
// (no next/headers, no JSX) so it's safe to import from both Node server code
// and src/proxy.ts (Edge runtime).

export type Team = "crm" | "blog";
export type Role = "admin" | "operativo" | "redactor";
export type ProfileRole = { team: Team; role: Role };

export const isCrmAdmin = (p: ProfileRole) => p.team === "crm" && p.role === "admin";
export const isCrmOperativo = (p: ProfileRole) => p.team === "crm" && p.role === "operativo";
export const isBlogAdmin = (p: ProfileRole) => p.team === "blog" && p.role === "admin";
export const isBlogRedactor = (p: ProfileRole) => p.team === "blog" && p.role === "redactor";

// CRM admin is the app's general admin — full access everywhere, including
// the blog, on top of running the CRM itself and assigning every account.
export const canAccessCrm = (p: ProfileRole) => isCrmAdmin(p) || isCrmOperativo(p);
export const canAccessBlog = (p: ProfileRole) => isCrmAdmin(p) || isBlogAdmin(p) || isBlogRedactor(p);
export const canManageUsers = (p: ProfileRole) => isCrmAdmin(p);
export const canDeleteCrmData = (p: ProfileRole) => isCrmAdmin(p);
export const canDeleteArticles = (p: ProfileRole) => isCrmAdmin(p) || isBlogAdmin(p);
export const showsBlogAdminView = (p: ProfileRole) => isCrmAdmin(p) || isBlogAdmin(p);
