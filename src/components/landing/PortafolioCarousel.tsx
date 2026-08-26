"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";

export type Proyecto = {
  image: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
};

// Split out of Portafolio.tsx and loaded via next/dynamic({ ssr: false }) so
// Swiper's JS/CSS (4 modules, 4 stylesheets) isn't part of the homepage's
// initial bundle — it's fetched as its own chunk after hydration instead.
export default function PortafolioCarousel({
  proyectos,
  onSelect,
}: {
  proyectos: Proyecto[];
  onSelect: (proyecto: Proyecto) => void;
}) {
  return (
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
      {proyectos.map((proyecto) => (
        <SwiperSlide
          key={proyecto.title}
          className="tp-glass rounded-2xl p-6 mx-4 flex flex-col items-center cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => onSelect(proyecto)}
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
  );
}
