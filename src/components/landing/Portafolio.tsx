"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { FaFacebookF, FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";
import Reveal from "./Reveal";

/**
 * Landing section (`#portafolio`) presenting past projects in a carousel
 * (loaded on the client only, see `PortafolioCarousel` below) plus a
 * lightbox-style modal for viewing a selected project's full details, with
 * keyboard (arrow/escape) and swipe navigation between projects.
 */
const PortafolioCarousel = dynamic(() => import("./PortafolioCarousel"), {
  ssr: false,
  loading: () => (
    <div className="tp-swiper flex gap-6 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="tp-glass h-72 w-full max-w-xs shrink-0 animate-pulse rounded-2xl"
        />
      ))}
    </div>
  ),
});

const PROYECTOS = [
  {
    image: "/img/portfolio/tijuana-innovadora.webp",
    title: "Tijuana Innovadora",
    description: "Sitio institucional para movimiento ciudadano de arte, ciencia y tecnología.",
    tags: ["Desarrollo web", "Sitio institucional"],
    url: "https://tijuanainnovadora.org/",
  },
  {
    image: "/img/portfolio/property-dreamz.webp",
    title: "Property Dreamz",
    description: "Plataforma inmobiliaria bilingüe para bienes raíces en México.",
    tags: ["Desarrollo web", "Plataforma inmobiliaria", "Bilingüe"],
    url: "https://www.propertydreamz.com/",
  },
  {
    image: "/img/portfolio/noticias33.webp",
    title: "Noticias 33",
    description: "Portal de noticias de México y el mundo.",
    tags: ["Desarrollo web", "Portal de noticias"],
    url: "https://noticias33.com/",
  },
  {
    image: "/img/portfolio/old-souls.webp",
    title: "Old Souls Restaurante",
    description: "Desarrollo web, seguridad, experiencia industrial.",
    tags: ["Desarrollo web", "Ciberseguridad", "Experiencia industrial"],
    url: "https://www.oldsoulsrestaurante.com/",
  },
  {
    image: "/img/portfolio/edie.webp",
    title: "Escuela de Ingles Especializada",
    description: "Desarrollo web y SEO local.",
    tags: ["Desarrollo web", "SEO local"],
    url: "https://industrialbajasupply.com/",
  },
  {
    image: "/img/portfolio/cervantes.webp",
    title: "Cervantes Quijano Abogados",
    description: "Admin web + correo empresarial seguro.",
    tags: ["Panel administrativo", "Correo empresarial", "Seguridad"],
    url: "https://prosin.com.mx/",
  },
  {
    image: "/img/portfolio/prosin.webp",
    title: "PROSIN",
    description: "Desarrollo web, seguridad, experiencia industrial.",
    tags: ["Desarrollo web", "Ciberseguridad", "Experiencia industrial"],
    url: "https://www.oldsoulsrestaurante.com/",
  },
  {
    image: "/img/portfolio/rentas.webp",
    title: "Rentas TJ",
    description: "Desarrollo web y SEO local.",
    tags: ["Desarrollo web", "SEO local"],
    url: "https://industrialbajasupply.com/",
  },
  {
    image: "/img/portfolio/bel-industrial.webp",
    title: "BelIndusrial",
    description: "Admin web + correo empresarial seguro.",
    tags: ["Panel administrativo", "Correo empresarial", "Seguridad"],
    url: "https://prosin.com.mx/",
  },
];

const SOCIAL_LINKS = [
  { href: "https://facebook.com/techplacetijuana", icon: FaFacebookF, label: "Facebook" },
  { href: "https://wa.me/526643425615", icon: FaWhatsapp, label: "WhatsApp" },
  { href: "https://www.linkedin.com/company/techplacetj", icon: FaLinkedinIn, label: "LinkedIn" },
  { href: "https://github.com/tone-stone", icon: FaGithub, label: "GitHub" },
];

/** Portfolio grid section with project carousel and detail modal. */
export default function Portafolio() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = PROYECTOS.length;
  const proyectoActivo = activeIndex !== null ? PROYECTOS[activeIndex] : null;

  const close = useCallback(() => setActiveIndex(null), []);
  const goPrev = useCallback(
    () => setActiveIndex((i) => (i === null ? i : (i - 1 + total) % total)),
    [total]
  );
  const goNext = useCallback(
    () => setActiveIndex((i) => (i === null ? i : (i + 1) % total)),
    [total]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, close, goPrev, goNext]);

  // Jump back to the top of the panel when switching to another project.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeIndex]);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) goPrev();
    else if (delta < -50) goNext();
    touchStartX.current = null;
  };

  return (
    <section id="portafolio" className="relative py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Portafolio de proyectos
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light mb-10 text-justify">
            Plataformas y sistemas en producción. Despachos, restaurantes, medios
            y startups que han confiado su presencia digital a TechPlace.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <PortafolioCarousel proyectos={PROYECTOS} onSelect={setActiveIndex} />
        </Reveal>
        <div className="mt-8">
          <a href="#contacto" className="text-brand-blue font-bold underline hover:text-brand-blue">
            ¿Quieres que tu empresa sea el próximo caso? Solicita tu cotización.
          </a>
        </div>
      </div>

      {proyectoActivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 tp-animate-fadein"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Proyecto anterior"
            className="absolute left-2 sm:left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-gray-200 shadow-lg ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Proyecto siguiente"
            className="absolute right-2 sm:right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-gray-200 shadow-lg ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/70 hover:text-white"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div
            ref={scrollRef}
            className="tp-glass relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl text-left shadow-[0_0_80px_rgba(126,34,206,0.35)] ring-1 ring-purple-400/20"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <span className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_15%_0%,rgba(147,51,234,0.20)_0,transparent_45%),radial-gradient(circle_at_100%_100%,rgba(67,56,202,0.22)_0,transparent_45%)]" />

            <div className="absolute top-5 left-5 z-10 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold tabular-nums text-gray-300">
              {(activeIndex ?? 0) + 1} / {total}
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute top-5 right-5 z-10 rounded-full bg-black/40 p-2 text-gray-300 hover:text-white hover:bg-black/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative grid md:grid-cols-2">
              <div className="relative flex items-center justify-center bg-black/30 p-8 md:p-10 md:border-r border-white/10">
                <Image
                  src={proyectoActivo.image}
                  alt={proyectoActivo.title}
                  width={480}
                  height={320}
                  className="rounded-xl w-full h-56 md:h-72 object-contain drop-shadow-[0_0_30px_rgba(126,34,206,0.35)]"
                />
              </div>

              <div className="flex flex-col p-8 md:p-10">
                <h3 className="font-heading text-2xl md:text-3xl text-white font-bold mb-3 tracking-tight">
                  {proyectoActivo.title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {proyectoActivo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-gray-300 leading-relaxed mb-6 text-justify">{proyectoActivo.description}</p>

                <p className="text-sm text-gray-400 leading-relaxed mb-8 text-justify">
                  Este es uno de nuestros casos de éxito. Navega el sitio en vivo y descubre de primera
                  mano el diseño, la velocidad y la seguridad con los que lo construimos en TechPlace.
                </p>

                <a
                  href={proyectoActivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tp-btn-animated inline-flex w-fit items-center gap-2 rounded-full px-6 py-3 text-white font-bold shadow-lg transition-transform hover:scale-105"
                >
                  Visitar sitio
                  <ExternalLink className="h-4 w-4" />
                </a>

                <div className="mt-auto pt-8">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                    Conecta con TechPlace
                  </p>
                  <div className="flex gap-3">
                    {SOCIAL_LINKS.map((social) => (
                      <a
                        key={social.href}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tp-social-btn"
                        aria-label={social.label}
                      >
                        <social.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
