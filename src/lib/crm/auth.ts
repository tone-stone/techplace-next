import { createClient } from "@/lib/supabase/server";

// Not a "use server" file: requireAdmin() is only ever called from within
// other server action files, never invoked directly from a client component,
// so it doesn't need to (and shouldn't) be its own callable server action.

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { ok: false as const, error: "No tienes permisos de administrador" };

  return { ok: true as const, userId: user.id };
}
