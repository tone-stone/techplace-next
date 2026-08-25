"use client";

import Image from "next/image";
import { Globe, Mail, MapPin, MessageSquare, Send, User } from "lucide-react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa6";
import { motion } from "motion/react";
import { useState } from "react";
import Reveal from "./Reveal";

type EstadoForm = { message: string; error: boolean } | null;

export default function Contacto() {
  const [estado, setEstado] = useState<EstadoForm>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setEnviando(true);
    setEstado({ message: "Enviando…", error: false });

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setEstado({ message: "¡Mensaje enviado! Te responderemos pronto 😊", error: false });
        form.reset();
      } else {
        setEstado({
          message: "Error al enviar. Intenta de nuevo o contáctanos por WhatsApp.",
          error: true,
        });
      }
    } catch {
      setEstado({
        message: "Error al enviar. Intenta de nuevo o contáctanos por WhatsApp.",
        error: true,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section id="contacto" className="relative py-20 border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4">
        <Reveal>
          <h2 className="tp-heading font-heading text-3xl md:text-4xl font-extrabold mb-8 tracking-tight text-center">
            Contáctanos
          </h2>
        </Reveal>
        <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
          <Reveal className="tp-glass w-full md:w-1/2 rounded-3xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6" action="https://formspree.io/f/xwpbgpkr" method="POST">
              <div className="relative group">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Tu Nombre"
                  className="tp-glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition duration-200"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              </div>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Tu Email"
                  className="tp-glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition duration-200"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
              </div>
              <div className="relative group">
                <textarea
                  name="mensaje"
                  rows={4}
                  required
                  placeholder="¿En qué te ayudamos?"
                  className="tp-glass-input w-full pl-12 pr-4 py-3 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition duration-200"
                />
                <MessageSquare className="absolute left-4 top-3.5 h-4 w-4 text-purple-400" />
              </div>
              <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />

              {estado && (
                <motion.p
                  key={estado.message}
                  initial={estado.error ? { x: -6 } : { opacity: 0 }}
                  animate={
                    estado.error
                      ? { x: [-6, 6, -4, 4, 0] }
                      : { opacity: 1 }
                  }
                  transition={{ duration: 0.4 }}
                  className={`text-sm ${estado.error ? "text-red-400" : "text-purple-300"}`}
                >
                  {estado.message}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={enviando}
                whileHover={{ scale: enviando ? 1 : 1.03 }}
                whileTap={{ scale: enviando ? 1 : 0.97 }}
                className="tp-btn-animated relative px-10 py-3 rounded-full font-bold shadow-lg transition-opacity duration-300 text-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" /> Enviar mensaje
                </span>
              </motion.button>
            </form>
            <div className="mt-10 text-gray-400 text-left space-y-3">
              <p className="flex items-center gap-2">
                <FaWhatsapp className="text-green-400 text-xl" />
                <a
                  href="https://wa.me/526643425615"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline font-semibold"
                >
                  664 342 56 15
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="text-brand-blue h-5 w-5" />
                <a
                  href="https://techplacetj.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline font-semibold"
                >
                  www.techplacetj.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <FaFacebookF className="text-blue-400 h-5 w-5" />
                <a
                  href="https://facebook.com/techplacetijuana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline font-semibold"
                >
                  /techplacetj
                </a>
              </p>
              <p className="flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 text-purple-400" /> Tijuana, B.C. | Lun-Vie 10am-4pm
              </p>
            </div>
          </Reveal>
          <Reveal className="tp-glass hidden md:flex md:w-1/2 rounded-3xl p-6 items-center justify-center" delay={0.15}>
            <Image
              src="/img/logos/techplace-brand.webp"
              alt="Ilustración contacto"
              width={480}
              height={480}
              loading="eager"
              className="w-3/4 md:w-full max-w-xl mx-auto rounded-2xl"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
