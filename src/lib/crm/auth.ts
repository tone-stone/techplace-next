import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE, IDLE_TIMEOUT_MS } from "@/lib/auth/session";
import { canAccessCrm, isCrmAdmin, type ProfileRole } from "@/lib/auth/roles";

// Not a "use server" file: these are only ever called from within other
// server action files, never invoked directly from a client component, so
// they don't need to (and shouldn't) be their own callable server actions.

async function requireCrmRole(predicate: (p: ProfileRole) => boolean, deniedMessage: string) {
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

  const { data: profile } = await supabase.from("profiles").select("team, role").eq("id", user.id).single();
  if (!profile || !predicate(profile as ProfileRole)) {
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

  return { ok: true as const, userId: user.id };
}

// CRM admin or operativo — create/update access. Most CRM mutations use this.
export function requireCrmAccess() {
  return requireCrmRole(canAccessCrm, "No tienes permisos para el CRM");
}

// CRM admin only — reserved for delete actions and other admin-only operations.
export function requireCrmAdmin() {
  return requireCrmRole(isCrmAdmin, "Solo un administrador del CRM puede hacer esto");
}
