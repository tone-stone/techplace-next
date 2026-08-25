import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";
import Aurora from "@/components/landing/Aurora";

export const metadata: Metadata = {
  title: "Panel | TechPlace",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-white px-4 text-center">
      <Aurora />
      <div className="tp-glass rounded-3xl p-10 flex flex-col items-center gap-4 max-w-md">
        <h1 className="tp-heading font-heading text-3xl font-extrabold">Bienvenido a TechPlace</h1>
        <p className="text-gray-300">
          Sesión iniciada como <span className="text-purple-400">{user?.email}</span>
        </p>
        <p className="text-gray-500 text-sm">El panel de administración está en construcción.</p>
        <form action={logout}>
          <button
            type="submit"
            className="tp-btn-animated px-6 py-2 rounded-full font-bold text-white shadow-lg hover:scale-105 transition-transform"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
