import { Activity, CheckCircle2, Globe, Newspaper, Users } from "lucide-react";
import Reveal from "./Reveal";

/**
 * Landing section (`#plataforma`) that pitches TechPlace's all-in-one offer
 * (site + CMS + CRM as a single owned system) against the typical
 * multi-vendor setup, using a two-column "before/after" comparison card.
 */
const PIEZAS = [
  { icon: Globe, label: "Sitio web corporativo" },
  { icon: Newspaper, label: "CMS de blog" },
  { icon: Users, label: "CRM de clientes" },
  { icon: Activity, label: "Monitoreo y seguridad" },
];

/** Renders the "unbundled vendors" vs. "TechPlace" comparison section. */
export default function PlataformaIntegral() {
  return (
    <section id="plataforma" className="relative py-20 border-t border-white/10">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
            Una plataforma completa, <span className="text-brand-blue">no un sitio más</span>
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light mb-14 text-justify">
            Sitio web, CMS y CRM suelen ser tres productos con tres mensualidades
            distintas, de tres proveedores distintos. Nosotros los integramos en un
            solo sistema — hecho a tu medida, de tu propiedad, sin licencias de
            terceros ni límites de plantilla.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          <Reveal y={0}>
            <div className="tp-glass h-full rounded-2xl p-8 text-left opacity-70">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-500">
                Lo típico
              </p>
              <ul className="space-y-4">
                {PIEZAS.map((p) => (
                  <li key={p.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3 text-gray-300">
                      <p.icon className="h-5 w-5 shrink-0 text-gray-500" />
                      {p.label}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">+ mensualidad</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-gray-500 text-justify">
                Cuatro proveedores distintos, cuatro facturas, tus datos repartidos
                entre plataformas que no se hablan entre sí.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} y={0}>
            <div className="tp-glass tp-glass-hover h-full rounded-2xl p-8 text-left ring-1 ring-purple-400/30 shadow-[0_0_40px_rgba(126,34,206,0.15)]">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-brand-blue">
                Con TechPlace
              </p>
              <ul className="space-y-4">
                {PIEZAS.map((p) => (
                  <li key={p.label} className="flex items-center gap-3 text-white">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    {p.label}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-gray-300 text-justify">
                Un solo sistema, un solo equipo responsable de que todo funcione en
                conjunto, y el código es tuyo — sin depender de nadie más.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
