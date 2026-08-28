"use client";

/**
 * Coverflow-style Swiper carousel that displays the portfolio projects on
 * the landing page, rendered from `Portafolio.tsx` (see the code-splitting
 * note below).
 */

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
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
/**
 * Renders the project slides. Clicking a slide opens that project.
 *
 * @param proyectos - Projects to render as slides.
 * @param onSelect - Called with a project's index when its slide is clicked,
 * so the parent can open the detail modal.
 */
export default function PortafolioCarousel({
  proyectos,
  onSelect,
}: {
  proyectos: Proyecto[];
  onSelect: (index: number) => void;
}) {
  // Nav buttons live outside <Swiper> (see the wrapping div below) instead of
  // as children of it, and are wired up via direct element refs rather than
  // the `.portafolio-next`/`-prev` selector strings we used to pass to
  // `navigation` — Swiper's root has `overflow: hidden` (needed to clip
  // off-screen slides), so buttons pushed outward from inside it were
  // getting silently clipped away instead of sitting outside the cards.
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

  return (
    <div className="relative">
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
        navigation={{ enabled: true, nextEl, prevEl }}
        breakpoints={{
          640: { slidesPerView: 1.4, centeredSlides: true },
          768: { slidesPerView: 2, centeredSlides: false, spaceBetween: 30 },
          1200: { slidesPerView: 3, centeredSlides: false },
        }}
        className="tp-swiper pb-12!"
      >
        {proyectos.map((proyecto, i) => (
          <SwiperSlide
            key={proyecto.title}
            className="tp-glass rounded-2xl p-6 mx-4 flex flex-col items-center cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => onSelect(i)}
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
            <p className="text-gray-400 text-sm mb-2 text-justify">{proyecto.description}</p>
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
      </Swiper>

      {/* Hidden on mobile (swipe/drag carries the interaction there), shown
          on desktop and pushed outside the cards. */}
      <button
        ref={setPrevEl}
        type="button"
        aria-label="Proyecto anterior"
        className="absolute left-0 top-1/2 z-10 hidden -translate-x-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-2.5 text-purple-300 shadow-lg ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/70 hover:text-white md:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        ref={setNextEl}
        type="button"
        aria-label="Proyecto siguiente"
        className="absolute right-0 top-1/2 z-10 hidden translate-x-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-2.5 text-purple-300 shadow-lg ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-black/70 hover:text-white md:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}
