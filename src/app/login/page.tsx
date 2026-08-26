import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LoginCardShell from "./LoginCardShell";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión | TechPlace",
  description: "Accede al panel de TechPlace.",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden font-sans bg-[#09090f] text-white px-4 py-8">
      <video autoPlay muted loop playsInline className="tp-login-video-bg" poster="/img/backup-dark-bg.webp">
        <source src="/video/bg.mp4" type="video/mp4" />
        Tu navegador no soporta videos en HTML5.
      </video>
      <div className="tp-login-overlay" />

      <LoginCardShell>
        <div className="flex flex-col items-center mb-5 sm:mb-8">
          <Image
            src="/img/logos/techplace-icon.webp"
            alt="TechPlace"
            width={80}
            height={80}
            priority
            className="h-14 w-14 sm:h-20 sm:w-20 mb-2 sm:mb-3 rounded-full drop-shadow-[0_0_18px_rgba(144,205,221,0.45)]"
          />
          <h2 className="tp-heading font-heading text-2xl sm:text-3xl font-extrabold tracking-wide">
            Acceso TechPlace
          </h2>
        </div>

        <LoginForm />

        <div className="flex justify-between items-center mt-5 sm:mt-6 text-sm">
          <a href="#" className="text-brand-blue hover:text-brand-blue hover:underline transition">
            ¿Olvidaste tu contraseña?
          </a>
          <Link href="/" className="text-gray-300 hover:text-gray-100 hover:underline transition">
            Regresar
          </Link>
        </div>
      </LoginCardShell>
    </div>
  );
}
