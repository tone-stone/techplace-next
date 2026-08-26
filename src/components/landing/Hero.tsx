import { ShieldCheck } from "lucide-react";

const SLIDES = [
  "Tu futuro digital empieza aquí",
  "Seguridad & Web a otro nivel",
  "Innovación para negocios modernos",
];

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex items-center justify-center min-h-screen pt-24 pb-10 overflow-hidden"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="tp-video-bg"
        poster="/img/backup-dark-bg.webp"
      >
        <source src="/video/bg.mp4" type="video/mp4" />
        Tu navegador no soporta videos en HTML5.
      </video>
      <div className="tp-hero-overlay" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-violet-700/20 blur-3xl z-[1] animate-[tp-float_9s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl z-[1] animate-[tp-float_11s_ease-in-out_infinite_reverse]"
      />

      <div className="tp-hero-content relative z-20 text-center w-full max-w-full md:max-w-2xl mx-auto">
        <div className="tp-hero-slides select-none mb-4 w-full max-w-full md:max-w-2xl mx-auto">
          {SLIDES.map((text, i) => (
            <h1
              key={text}
              style={{ animationDelay: `${i * 2.8}s` }}
              className="tp-hero-slide tp-heading font-heading text-3xl sm:text-4xl md:text-6xl font-extrabold drop-shadow-xl tracking-tight"
            >
              {text}
            </h1>
          ))}
        </div>
        <p className="text-base sm:text-lg md:text-2xl text-gray-200 mb-8 drop-shadow-lg font-light tp-animate-fadein">
          Desarrollamos sitios web y blindamos tus datos.
          <br />
          Innovación y seguridad para negocios modernos.
        </p>
        <a
          href="#contacto"
          className="tp-btn-animated inline-flex items-center text-white px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-full text-base sm:text-lg font-bold shadow-lg shadow-blue-900/40 transition-transform duration-300 hover:scale-105 active:scale-97"
        >
          <ShieldCheck className="mr-2 h-5 w-5" />
          Solicita tu consultoría
        </a>
      </div>
    </section>
  );
}
