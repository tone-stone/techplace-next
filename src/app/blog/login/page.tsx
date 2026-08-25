import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Newspaper, PenSquare, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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

export default async function BlogLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/blog/dashboard");
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#050409] text-white">
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b0a1a] via-[#151233] to-[#05040c] p-12">
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(79,70,229,0.28)_0,transparent_55%),radial-gradient(circle_at_85%_85%,rgba(99,102,241,0.18)_0,transparent_50%)]" />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:26px_26px] opacity-40" />

        <Link
          href="/blog"
          className="relative z-10 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-300 transition-colors w-fit"
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

      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-12">
        <Link
          href="/blog"
          className="lg:hidden absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al blog
        </Link>

        <div className="w-full max-w-sm">
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

          <h2 className="text-2xl font-bold text-white mb-2">Inicia sesión</h2>
          <p className="text-gray-400 text-sm mb-8">Ingresa tus credenciales de redactor para continuar.</p>

          <LoginForm redirectTo="/blog/dashboard" />

          <div className="flex justify-between items-center mt-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-indigo-300 hover:underline transition">
              ¿Olvidaste tu contraseña?
            </a>
            <Link href="/blog/admin-login" className="text-gray-500 hover:text-gray-300 hover:underline transition">
              Acceso admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
