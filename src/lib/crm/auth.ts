import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_COOKIE, IDLE_TIMEOUT_MS } from "@/lib/auth/session";

// Not a "use server" file: requireAdmin() is only ever called from within
// other server action files, never invoked directly from a client component,
// so it doesn't need to (and shouldn't) be its own callable server action.

export async function requireAdmin() {
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false as const, error: "No tienes permisos de administrador" };

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
