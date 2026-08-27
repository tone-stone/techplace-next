"use client";

import { FaWhatsapp } from "react-icons/fa6";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/526643425615"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      title="¡Envíanos un WhatsApp!"
      className="tp-whatsapp-in group fixed bottom-6 right-6 z-30 md:z-50 flex items-center justify-center w-16 h-16 bg-green-500/40 backdrop-blur-md border border-white/20 rounded-full shadow-lg transition duration-200 hover:scale-[1.08] hover:bg-green-500/80 active:scale-95 active:bg-green-500/90"
    >
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        ¡Escríbenos!
      </span>
      <FaWhatsapp className="h-8 w-8 text-white relative" />
    </a>
  );
}
