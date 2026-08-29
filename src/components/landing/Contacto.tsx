"use client";

import Image from "next/image";
import { Globe, Mail, MapPin, MessageSquare, Send, User } from "lucide-react";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa6";
import { useRef, useState } from "react";
import Reveal from "./Reveal";
import { trackInteraction } from "@/lib/monitoring/engagement";

/** Status/feedback message shown under the contact form after a submit attempt, or `null` before one happens. */
type EstadoForm = { message: string; error: boolean } | null;

/**
 * The "Contáctanos" section (`#contacto`): a contact form that posts to
 * Formspree, plus direct WhatsApp/website/Facebook links and business hours.
 * Handles form submission asynchronously so the page never navigates away.
 */
export default function Contacto() {
  const [estado, setEstado] = useState<EstadoForm>(null);
  const [enviando, setEnviando] = useState(false);
  // Funnel tracking: fire `start` once, on the first field the visitor touches.
  const startedRef = useRef(false);

  const handleFirstFocus = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackInteraction("form", { form: "contacto", step: "start" });
  };

  // Submits the form via fetch (instead of a normal POST navigation) so we can
  // show inline success/error feedback without leaving the page.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setEnviando(true);
    setEstado({ message: "Enviando…", error: false });
    trackInteraction("form", { form: "contacto", step: "submit" });

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setEstado({ message: "¡Mensaje enviado! Te responderemos pronto 😊", error: false });
        form.reset();
        trackInteraction("form", { form: "contacto", step: "success" });
      } else {
        setEstado({
          message: "Error al enviar. Intenta de nuevo o contáctanos por WhatsApp.",
          error: true,
        });
        trackInteraction("form", { form: "contacto", step: "error" });
      }
    } catch {
      setEstado({
        message: "Error al enviar. Intenta de nuevo o contáctanos por WhatsApp.",
        error: true,
      });
      trackInteraction("form", { form: "contacto", step: "error" });
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
            <form
              onSubmit={handleSubmit}
              onFocus={handleFirstFocus}
              className="space-y-6"
              action="https://formspree.io/f/xwpbgpkr"
              method="POST"
            >
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
                <p
                  key={estado.message}
                  className={`text-sm ${estado.error ? "tp-shake text-red-400" : "tp-fade-in text-purple-300"}`}
                >
                  {estado.message}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="tp-btn-animated relative px-10 py-3 rounded-full font-bold shadow-lg transition-[opacity,transform] duration-300 text-lg text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:opacity-60 not-disabled:hover:scale-[1.03] not-disabled:active:scale-[0.97]"
              >
                <span className="inline-flex items-center gap-2">
                  <Send className="h-4 w-4" /> Enviar mensaje
                </span>
              </button>
            </form>
            <div className="mt-10 text-gray-400 text-left space-y-3">
              <a
                href="https://wa.me/526643425615"
                target="_blank"
                rel="noopener noreferrer"
                className="-my-2 flex items-center gap-2 py-2 text-green-400 hover:underline font-semibold"
              >
                <FaWhatsapp className="text-green-400 text-xl shrink-0" />
                664 342 56 15
              </a>
              <a
                href="https://techplacetj.com"
                target="_blank"
                rel="noopener noreferrer"
                className="-my-2 flex items-center gap-2 py-2 text-brand-blue hover:underline font-semibold"
              >
                <Globe className="text-brand-blue h-5 w-5 shrink-0" />
                www.techplacetj.com
              </a>
              <a
                href="https://facebook.com/techplacetijuana"
                target="_blank"
                rel="noopener noreferrer"
                className="-my-2 flex items-center gap-2 py-2 text-blue-400 hover:underline font-semibold"
              >
                <FaFacebookF className="text-blue-400 h-5 w-5 shrink-0" />
                /techplacetj
              </a>
              <p className="flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 text-purple-400" /> Tijuana, B.C. | Lun-Vie 10am-4pm
              </p>
            </div>
          </Reveal>
          <Reveal className="tp-glass hidden md:flex md:w-1/2 rounded-3xl p-6 items-center justify-center" delay={0.15}>
            <Image
              src="/img/logos/techplace-brand.webp"
              alt="TechPlace — desarrollo web, apps y ciberseguridad en Tijuana"
              width={480}
              height={480}
              loading="lazy"
              sizes="480px"
              className="w-3/4 md:w-full max-w-xl mx-auto rounded-2xl"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
