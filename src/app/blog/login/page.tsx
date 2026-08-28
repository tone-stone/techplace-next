/**
 * Sign-in page for the blog/CMS portal at `/blog/login`. Redirects an
 * already-authenticated user straight to their dashboard (blog staff to
 * `/blog/dashboard`, anyone else to `/admin`) instead of showing the form,
 * and otherwise renders the branded split-screen login layout around the
 * shared `LoginForm`.
 */
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Home, Newspaper, PenSquare, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { canAccessBlog, type ProfileRole } from "@/lib/auth/roles";
import LoginFooter from "@/components/auth/LoginFooter";
import LoginForm from "../../login/LoginForm";

export const metadata: Metadata = {
  title: "Portal de Redacción | TechPlace",
  description: "Accede al portal de redacción para gestionar los artículos del blog de TechPlace.",
};

const FEATURES = [
  { icon: Newspaper, text: "Publica noticias de tecnología, ciberseguridad e IA" },
  { icon: PenSquare, text: "Redacta y edita artículos del blog" },
  { icon: Users, text: "Acceso exclusivo para el equipo de contenido" },
];

/**
 * Renders the blog portal's login screen, or redirects away if the visitor
 * is already signed in.
 *
 * @param searchParams - May carry `expired=1` after an idle-timeout logout,
 * shown as a banner prompting the user to sign in again.
 */
export default async function BlogLoginPage({
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
    // Already signed in with an account that isn't blog — send them to their
    // actual portal instead of dropping them into /blog/dashboard (proxy.ts
    // would just bounce them out again).
    const { data: profile } = await supabase.from("profiles").select("team, role").eq("id", user.id).single();
    redirect(profile && canAccessBlog(profile as ProfileRole) ? "/blog/dashboard" : "/admin");
  }

  return (
    <div className="relative min-h-dvh flex font-sans text-white">
      <video autoPlay muted loop playsInline className="tp-login-video-bg" poster="/img/backup-dark-bg.webp">
        <source src="/video/bg.mp4" type="video/mp4" />
        Tu navegador no soporta videos en HTML5.
      </video>
      <div className="tp-login-overlay" />

      <div className="relative z-10 hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b0a1a]/85 via-[#151233]/80 to-[#05040c]/85 p-12">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(79,70,229,0.28)_0,transparent_55%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.18)_0,transparent_50%)]" />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:26px_26px] opacity-40" />

        <Link
          href="/blog"
          className="relative z-10 inline-flex w-fit items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al blog
        </Link>

        <div className="relative z-10">
          <span className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 mb-8">
            <PenSquare className="h-8 w-8 text-indigo-300" strokeWidth={1.5} />
          </span>
          <h1 className="font-heading text-4xl xl:text-5xl font-extrabold tracking-tight mb-4">
            Portal de
            <br />
            Redacción
          </h1>
          <p className="text-gray-400 text-lg font-light max-w-md leading-relaxed">
            El espacio para el equipo de contenido de TechPlace: comparte conocimiento y mantén
            informada a la comunidad.
          </p>

          <div className="mt-10 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.text} className="flex items-center gap-3 text-gray-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                  <feature.icon className="h-4 w-4 text-indigo-300" />
                </span>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          TechPlace &mdash; Desarrollo, Ciberseguridad &amp; IA
        </div>
      </div>

      <div className="relative z-10 flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12">
        {/* Back-to-blog: mobile only (desktop shows it in the brand panel) */}
        <Link
          href="/blog"
          className="lg:hidden absolute top-6 left-6 -m-3 inline-flex items-center gap-1.5 p-3 text-sm text-gray-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al blog
        </Link>

        {/* Home: top-right corner, every size */}
        <Link
          href="/"
          aria-label="Ir al inicio"
          title="Inicio"
          className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-colors hover:text-indigo-300 sm:right-8 sm:top-8"
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
              <p className="text-xs text-indigo-300 leading-tight">Redacción</p>
            </div>
          </div>

          <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-indigo-400/60 bg-indigo-500/20 px-5 py-2 text-base sm:text-lg font-extrabold uppercase tracking-widest text-indigo-200 shadow-[0_0_24px_rgba(99,102,241,0.45)]">
            <PenSquare className="h-5 w-5" />
            Redacción
          </span>
          <h2 className="text-2xl font-bold text-white">Inicia sesión</h2>
          <p className="text-gray-400 text-sm mb-8 mt-1">Ingresa tus credenciales del equipo de contenido para continuar.</p>

          {expired && (
            <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-200">
              Tu sesión expiró por inactividad. Inicia sesión de nuevo.
            </p>
          )}

          <LoginForm redirectTo="/blog/dashboard" portal="blog" />

          <LoginFooter
            accent="indigo"
            switchHref="/login"
            switchLabel="Ir al panel de administración"
          />
        </div>
      </div>
    </div>
  );
}
