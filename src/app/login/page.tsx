import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Briefcase, Home, LayoutDashboard, Receipt, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { canAccessCrm, type ProfileRole } from "@/lib/auth/roles";
import LoginFooter from "@/components/auth/LoginFooter";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Panel de Administración | TechPlace",
  description:
    "Accede al panel de administración para gestionar clientes, proyectos y facturación de TechPlace.",
};

const FEATURES = [
  { icon: Users, text: "Gestiona clientes, leads y su historial" },
  { icon: Briefcase, text: "Da seguimiento a proyectos y entregas" },
  { icon: Receipt, text: "Cotizaciones, facturación y cobranza" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already signed in with an account that isn't CRM — send them to their
    // actual portal instead of dropping them into /admin (proxy.ts would
    // just bounce them out again).
    const { data: profile } = await supabase.from("profiles").select("team, role").eq("id", user.id).single();
    redirect(profile && canAccessCrm(profile as ProfileRole) ? "/admin" : "/blog/dashboard");
  }

  return (
    <div className="relative min-h-dvh flex font-sans text-white">
      <video autoPlay muted loop playsInline className="tp-login-video-bg" poster="/img/backup-dark-bg.webp">
        <source src="/video/bg.mp4" type="video/mp4" />
        Tu navegador no soporta videos en HTML5.
      </video>
      <div className="tp-login-overlay" />

      <div className="relative z-10 hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a1420]/85 via-[#0c2233]/80 to-[#05040c]/85 p-12">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.28)_0,transparent_55%),radial-gradient(circle_at_85%_85%,rgba(125,211,252,0.18)_0,transparent_50%)]" />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:26px_26px] opacity-40" />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-1.5 text-sm text-gray-400 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="relative z-10">
          <span className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-sky-500/10 border border-sky-400/30 mb-8">
            <LayoutDashboard className="h-8 w-8 text-sky-300" strokeWidth={1.5} />
          </span>
          <h1 className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight mb-4">
            Panel de
            <br />
            Administración
          </h1>
          <p className="text-gray-400 text-lg font-light max-w-md leading-relaxed">
            El centro de operaciones de TechPlace: clientes, proyectos, cotizaciones y facturación en
            un mismo lugar.
          </p>

          <div className="mt-10 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-center gap-3 text-gray-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <feature.icon className="h-4 w-4 text-sky-300" />
                </span>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
          TechPlace &mdash; Desarrollo, Ciberseguridad &amp; IA
        </div>
      </div>

      <div className="relative z-10 flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12">
        {/* Back-to-home: mobile only (desktop shows it in the brand panel) */}
        <Link
          href="/"
          className="lg:hidden absolute top-6 left-6 -m-3 inline-flex items-center gap-1.5 p-3 text-sm text-gray-400 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        {/* Home: top-right corner, every size */}
        <Link
          href="/"
          aria-label="Ir al inicio"
          title="Inicio"
          className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:text-sky-300 sm:right-8 sm:top-8"
        >
          <Home className="h-4 w-4" />
        </Link>

        <div className="tp-glass w-full max-w-sm rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-10">
            <Image
              src="/img/logos/techplace-icon.webp"
              alt="TechPlace"
              width={44}
              height={44}
              priority
              className="h-11 w-11 rounded-full"
            />
            <div>
              <p className="text-sm font-semibold text-white leading-tight">TechPlace</p>
              <p className="text-xs text-sky-300 leading-tight">Administración</p>
            </div>
          </div>

          <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-sky-400/60 bg-sky-500/20 px-5 py-2 text-base sm:text-lg font-extrabold uppercase tracking-widest text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.45)]">
            <LayoutDashboard className="h-5 w-5" />
            Administración · CRM
          </span>
          <h2 className="text-2xl font-bold text-white">Inicia sesión</h2>
          <p className="text-gray-400 text-sm mb-8 mt-1">
            Ingresa tus credenciales de administrador para continuar.
          </p>

          {expired && (
            <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
              Tu sesión expiró por inactividad. Inicia sesión de nuevo.
            </p>
          )}

          <LoginForm portal="crm" />

          <LoginFooter accent="blue" switchHref="/blog/login" switchLabel="Ir al portal de redacción" />
        </div>
      </div>
    </div>
  );
}
