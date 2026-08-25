"use client";

import { ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

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
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop
          autoplay={{ delay: 2800, disableOnInteraction: false }}
          allowTouchMove={false}
          className="tp-heroSwiper select-none mb-4 w-full max-w-full md:max-w-2xl mx-auto"
        >
          {SLIDES.map((text) => (
            <SwiperSlide key={text}>
              <h1 className="tp-heading font-heading text-3xl sm:text-4xl md:text-6xl font-extrabold drop-shadow-xl tracking-tight tp-animate-fadein">
                {text}
              </h1>
            </SwiperSlide>
          ))}
        </Swiper>
        <p className="text-base sm:text-lg md:text-2xl text-gray-200 mb-8 drop-shadow-lg font-light tp-animate-fadein">
          Desarrollamos sitios web y blindamos tus datos.
          <br />
          Innovación y seguridad para negocios modernos.
        </p>
        <motion.a
          href="#contacto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 15 } }}
          whileTap={{ scale: 0.97 }}
          className="tp-btn-animated inline-flex items-center text-white px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-full text-base sm:text-lg font-bold shadow-lg shadow-blue-900/40"
        >
          <ShieldCheck className="mr-2 h-5 w-5" />
          Solicita tu consultoría
        </motion.a>
      </div>
    </section>
  );
}
