"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Footer shared by both login pages: a back button, a "forgot password"
 * dialog (contact IT — there's no self-service reset flow), and a link to
 * switch to the other portal's login. Purely presentational/client-side; it
 * doesn't call any auth APIs itself.
 */

/**
 * Renders the login footer's back/forgot-password/switch-portal controls.
 * @param accent Color theme matching the portal: `blue` for CRM, `indigo` for blog.
 * @param switchHref Login URL of the other portal.
 * @param switchLabel Link text for switching to the other portal.
 */
// Shared footer for both login screens so they behave identically. They differ
// only by `accent` (blue = administración / CRM, indigo = redacción) and the
// wording passed in `switchLabel`.
export default function LoginFooter({
  accent,
  switchHref,
  switchLabel,
}: {
  accent: "blue" | "indigo";
  switchHref: string;
  switchLabel: string;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();
  const hover = accent === "blue" ? "hover:text-sky-300" : "hover:text-indigo-300";
  const accentText = accent === "blue" ? "text-sky-300" : "text-indigo-300";

  useEffect(() => {
    if (!showHelp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHelp(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showHelp]);

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm sm:mt-6">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else router.push("/");
          }}
          className={`inline-flex items-center gap-1.5 text-gray-300 transition hover:underline ${hover}`}
        >
          <ArrowLeft className="h-4 w-4" /> Regresar
        </button>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className={`transition hover:underline ${accentText}`}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <div className="mt-3 text-center text-xs text-gray-500">
        <Link href={switchHref} className={`transition hover:underline ${hover}`}>
          {switchLabel} →
        </Link>
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Recuperar contraseña"
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0d0b18] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-base font-bold text-white">¿Olvidaste tu contraseña?</p>
            <p className="mb-5 text-sm text-gray-400">
              Contacta a tu asesor de IT para restablecerla.
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className={`w-full rounded-full border border-white/10 px-4 py-2 text-sm text-gray-200 transition ${hover}`}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
