import { ShieldCheck } from "lucide-react";
import HeroBackground from "./HeroBackground";

const SLIDES = [
  "Ingeniería digital para empresas en crecimiento",
  "Desarrollo potenciado por inteligencia artificial",
  "Tecnología de vanguardia, resultados medibles",
];

/**
 * The landing page's opening section (`#home`): a looping background video
 * with a crossfading decorative tagline, the SEO-facing `<h1>`, an intro
 * paragraph, and the two primary calls to action (quote request / view
 * projects).
 */
export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex items-center justify-center min-h-screen pt-24 pb-10 overflow-hidden"
    >
      <HeroBackground />
      <div className="tp-hero-overlay" />
      <div
        aria-hidden
        className="tp-hero-blob pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-700/20 blur-3xl z-[1] animate-[tp-float_9s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="tp-hero-blob pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl z-[1] animate-[tp-float_11s_ease-in-out_infinite_reverse]"
      />

      <div className="tp-hero-content relative z-20 text-center w-full max-w-full px-5 sm:px-6 md:max-w-2xl mx-auto">
        {/* Decorative crossfading tagline — not a heading. The single real
            <h1> for SEO is the line below it. */}
        <div
          aria-hidden
          className="tp-hero-slides select-none mb-5 sm:mb-6 w-full max-w-full md:max-w-2xl mx-auto"
        >
          {SLIDES.map((text, i) => (
            <span
              key={text}
              style={{ animationDelay: `${i * 2.8}s` }}
              className="tp-hero-slide font-heading text-2xl sm:text-4xl md:text-6xl font-extrabold drop-shadow-xl tracking-tight leading-tight"
            >
              {text}
            </span>
          ))}
        </div>
        <h1 className="font-heading text-base sm:text-xl md:text-2xl font-bold text-white/95 mb-3 tracking-tight drop-shadow-lg leading-snug">
          Desarrollo web, apps y ciberseguridad en Tijuana
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg font-light tp-animate-fadein text-justify">
          Diseñamos, desarrollamos y aseguramos productos digitales a la medida,
          con inteligencia artificial integrada en cada etapa del proceso.
          Operamos desde Tijuana y Baja California, con cobertura remota en todo
          México.
        </p>
        {/* Wrapped so the entrance animation (from `.tp-hero-content > *`)
            lands on this div instead of the <a>. The <a> already runs its
            own `animation` (tp-gradient-shift, via .tp-btn-animated) — same
            collision as the headline slides above, avoided the same way:
            keep the two animated elements separate instead of letting two
            classes fight over one `animation` property. */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contacto"
            data-track="hero_cta_cotizacion"
            className="tp-btn-animated inline-flex items-center text-white px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-full text-base sm:text-lg font-bold shadow-lg shadow-blue-900/40 transition-transform duration-300 hover:scale-105 active:scale-[0.97]"
          >
            <ShieldCheck className="mr-2 h-5 w-5" />
            Solicita tu cotización
          </a>
          <a
            href="#portafolio"
            data-track="hero_ver_proyectos"
            className="inline-flex items-center rounded-full border border-white/25 px-6 sm:px-8 py-3 md:py-4 text-base sm:text-lg font-bold text-white/90 transition-colors duration-300 hover:bg-white/10 hover:text-white"
          >
            Ver proyectos
          </a>
        </div>
      </div>
    </section>
  );
}
