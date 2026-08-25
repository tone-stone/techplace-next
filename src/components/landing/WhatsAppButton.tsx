"use client";

import { FaWhatsapp } from "react-icons/fa6";
import { motion } from "motion/react";

export default function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/526643425615"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      title="¡Envíanos un WhatsApp!"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-green-500/40 backdrop-blur-md border border-white/20 rounded-full shadow-lg hover:bg-green-500/80 active:bg-green-500/90 transition-colors duration-300"
    >
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        ¡Escríbenos!
      </span>
      <FaWhatsapp className="h-8 w-8 text-white relative" />
    </motion.a>
  );
}
