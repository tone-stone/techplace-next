/**
 * `/servicios` index page: lists every service in `SERVICES` as a card
 * linking to its `/servicios/[slug]` detail page.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SERVICES } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Servicios | TechPlace",
  description:
    "Desarrollo web a la medida, inteligencia artificial, apps móviles, ciberseguridad, hosting y consultoría IT — bajo un mismo equipo de ingeniería.",
  alternates: { canonical: "/servicios" },
};

export default function ServiciosIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4">
      <Link
        href="/#servicios"
        className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-brand-blue transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>

      <div className="text-center mb-12">
        <h1 className="tp-heading font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Nuestros servicios
        </h1>
        <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light">
          Desarrollo full-stack, seguridad e infraestructura bajo un mismo equipo de ingeniería, con
          inteligencia artificial aplicada en todo el ciclo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <Link
              key={service.slug}
              href={`/servicios/${service.slug}`}
              className="tp-glass tp-glass-hover group flex flex-col gap-3 rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <Icon className="h-8 w-8 text-purple-300" strokeWidth={1.75} />
              <h2 className="text-lg font-bold text-white group-hover:text-brand-blue transition-colors">
                {service.title}
              </h2>
              <p className="text-sm text-gray-400">{service.cardDescription}</p>
              <span className="mt-auto pt-2 text-sm font-bold text-brand-blue">
                {service.cardCtaLabel} →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
