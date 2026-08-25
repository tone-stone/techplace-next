import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "../../login/LoginForm";

export const metadata: Metadata = {
  title: "Acceso Administrador | TechPlace",
  description: "Acceso restringido al panel de administración del blog de TechPlace.",
};

const CAPABILITIES = [
  { icon: LayoutDashboard, text: "Control total de artículos y publicaciones" },
  { icon: Users, text: "Gestión de usuarios: crear, editar y asignar roles" },
];

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/blog/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0510] p-6 font-sans text-white">
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.25)_0,transparent_55%),radial-gradient(circle_at_15%_90%,rgba(126,34,206,0.18)_0,transparent_50%)]" />
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:28px_28px] opacity-30" />

      <Link
        href="/blog"
        className="absolute left-6 top-6 z-10 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-purple-300"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al blog
      </Link>

      <div className="tp-dark-card-admin relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Image
              src="/img/logos/techplace-icon.webp"
              alt="TechPlace"
              width={64}
              height={64}
              priority
              className="h-16 w-16 rounded-full"
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#0a0510] bg-purple-600">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Panel de Administrador
          </h1>
          <p className="mt-2 text-sm text-gray-400">Acceso restringido al equipo directivo de TechPlace.</p>
        </div>

        <div className="mb-8 space-y-3">
          {CAPABILITIES.map((cap) => (
            <div key={cap.text} className="flex items-center gap-3 text-gray-300">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-400/25 bg-purple-500/10">
                <cap.icon className="h-4 w-4 text-purple-300" />
              </span>
              <span className="text-xs">{cap.text}</span>
            </div>
          ))}
        </div>

        <LoginForm redirectTo="/blog/dashboard" requiredRole="admin" />

        <div className="mt-6 flex items-center justify-between text-sm">
          <a href="#" className="text-gray-400 transition hover:text-purple-300 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
          <Link href="/blog/login" className="text-gray-500 transition hover:text-gray-300 hover:underline">
            Portal de Redacción
          </Link>
        </div>
      </div>
    </div>
  );
}
