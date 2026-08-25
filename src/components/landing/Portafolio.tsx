"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import Reveal from "./Reveal";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

const PROYECTOS = [
  {
    image: "/img/portfolio/old-souls.webp",
    title: "Old Souls Restaurante",
    description: "Desarrollo web, seguridad, experiencia industrial.",
    url: "https://www.oldsoulsrestaurante.com/",
  },
  {
    image: "/img/portfolio/edie.webp",
    title: "Escuela de Ingles Especializada",
    description: "Desarrollo web y SEO local.",
    url: "https://industrialbajasupply.com/",
  },
  {
    image: "/img/portfolio/cervantes.webp",
    title: "Cervantes Quijano Abogados",
    description: "Admin web + correo empresarial seguro.",
    url: "https://prosin.com.mx/",
  },
  {
    image: "/img/portfolio/prosin.webp",
    title: "PROSIN",
    description: "Desarrollo web, seguridad, experiencia industrial.",
    url: "https://www.oldsoulsrestaurante.com/",
  },
  {
    image: "/img/portfolio/rentas.webp",
    title: "Rentas TJ",
    description: "Desarrollo web y SEO local.",
    url: "https://industrialbajasupply.com/",
  },
  {
    image: "/img/portfolio/bel-industrial.webp",
    title: "BelIndusrial",
    description: "Admin web + correo empresarial seguro.",
    url: "https://prosin.com.mx/",
  },
];

export default function Portafolio() {
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
            autoplay={{ delay: 2000 }}
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
                className="tp-glass rounded-2xl p-6 mx-4 flex flex-col items-center"
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
    </section>
  );
}
