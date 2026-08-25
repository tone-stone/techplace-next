"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ExternalLink, X } from "lucide-react";
import { FaFacebookF, FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa6";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import Reveal from "./Reveal";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

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

type Proyecto = (typeof PROYECTOS)[number];

export default function Portafolio() {
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);

  useEffect(() => {
    if (!proyectoActivo) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProyectoActivo(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [proyectoActivo]);

  return (
    <section id="portafolio" className="relative py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-3xl md:text-4xl font-bold mb-8 tracking-tight">
            Portafolio de Proyectos
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Swiper
            modules={[Autoplay, EffectCoverflow, Navigation, Pagination]}
            slidesPerView={1.1}
            centeredSlides
            spaceBetween={24}
            loop
            autoplay={{ delay: 2000, pauseOnMouseEnter: true }}
            effect="coverflow"
            coverflowEffect={{ rotate: 20, depth: 150, slideShadows: true }}
            pagination={{ el: ".portafolio-pagination", clickable: true }}
            navigation={{ nextEl: ".portafolio-next", prevEl: ".portafolio-prev" }}
            breakpoints={{
              640: { slidesPerView: 1.4, centeredSlides: true },
              768: { slidesPerView: 2, centeredSlides: false, spaceBetween: 30 },
              1200: { slidesPerView: 3, centeredSlides: false },
            }}
            className="tp-swiper"
          >
            {PROYECTOS.map((proyecto) => (
              <SwiperSlide
                key={proyecto.title}
                className="tp-glass rounded-2xl p-6 mx-4 flex flex-col items-center cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => setProyectoActivo(proyecto)}
              >
                <Image
                  src={proyecto.image}
                  alt={proyecto.title}
                  width={200}
                  height={128}
                  loading="eager"
                  className="rounded-lg mb-4 shadow-lg h-32 object-contain"
                />
                <h3 className="text-xl text-white font-bold mb-1">{proyecto.title}</h3>
                <p className="text-gray-400 text-sm mb-2">{proyecto.description}</p>
                <a
                  href={proyecto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-brand-blue underline hover:text-brand-blue"
                >
                  Visitar sitio
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </SwiperSlide>
            ))}
            <div className="swiper-pagination portafolio-pagination" />
            <div className="swiper-button-next portafolio-next" />
            <div className="swiper-button-prev portafolio-prev" />
          </Swiper>
        </Reveal>
        <div className="mt-8">
          <a href="#contacto" className="text-brand-blue font-bold underline hover:text-brand-blue">
            ¿Quieres que tu negocio sea nuestro próximo caso de éxito?
          </a>
        </div>
      </div>

      {proyectoActivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 tp-animate-fadein"
          onClick={() => setProyectoActivo(null)}
        >
          <div
            className="tp-glass relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl text-left shadow-[0_0_80px_rgba(126,34,206,0.35)] ring-1 ring-purple-400/20"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_15%_0%,rgba(147,51,234,0.20)_0,transparent_45%),radial-gradient(circle_at_100%_100%,rgba(67,56,202,0.22)_0,transparent_45%)]" />

            <button
              type="button"
              onClick={() => setProyectoActivo(null)}
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
