import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import { listProjectBriefs } from "@/lib/briefs/actions";
import BriefsPanel from "@/components/admin/BriefsPanel";

export const metadata: Metadata = {
  title: "Cotizaciones | Panel TechPlace",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role === "admin" ? "admin" : "redactor";

  const briefsResult = await listProjectBriefs();
  const briefs = "briefs" in briefsResult ? briefsResult.briefs : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-[#160a1f] via-[#150c1e] to-[#05040c] text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-black/30 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-purple-300" />
          <h1 className="font-heading text-xl font-extrabold tracking-tight sm:text-2xl">Cotizaciones</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-xs text-gray-400 sm:inline">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-red-400/40 hover:text-red-300"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {"error" in briefsResult ? (
          <p className="text-sm text-red-400">No pudimos cargar las cotizaciones: {briefsResult.error}</p>
        ) : (
          <BriefsPanel initialBriefs={briefs} canManage={role === "admin"} />
        )}
      </main>
    </div>
  );
}
