import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import Reveal from "./Reveal";
import { getService } from "@/lib/services/catalog";

/**
 * Landing section (`#casos-de-uso`): concrete problem → solution stories in
 * an editorial / "magazine" layout — big index numerals and a ruled list
 * rather than the glass-card grid the other sections use, so it reads as a
 * distinct break. Each entry is collapsed by default (native `<details>`) so
 * the section stays short; opening one reveals the detail and a link to the
 * service page that made it possible. Content is curated here (one per
 * service).
 */
const CASOS = [
  {
    serviceSlug: "aplicaciones-moviles",
    title: "Un restaurante operando en papel",
    description:
      "Le construimos GastroGo: punto de venta, comandas, inventarios y administración en una sola plataforma para Web, iOS y Android.",
  },
  {
    serviceSlug: "desarrollo-web",
    title: "Una operación entera en hojas de cálculo",
    description:
      "La pasamos a una plataforma a la medida con roles, historial y reportes. El cierre de mes bajó de días a horas.",
  },
  {
    serviceSlug: "inteligencia-artificial",
    title: "Leads que se enfriaban antes de contestar",
    description:
      "Un flujo con n8n registra cada lead en el CRM, responde con IA y avisa al asesor. El primer contacto pasó a segundos.",
  },
  {
    serviceSlug: "hosting",
    title: "Correo institucional que nadie administraba",
    description:
      "Gestionamos el correo en Google Workspace y Microsoft 365 de organismos y empresas: cuentas, dominio, seguridad y soporte.",
  },
  {
    serviceSlug: "ciberseguridad",
    title: "Una plataforma a punto de lanzarse",
    description:
      "Pruebas de penetración sobre la app y la infraestructura, con informe priorizado. Los hallazgos críticos se corrigieron antes de abrir al público.",
  },
  {
    serviceSlug: "consultoria-it",
    title: "¿Construir a la medida o comprar?",
    description:
      "Comparamos costo a tres años, riesgos y tiempos. La recomendación: comprar el core y desarrollar solo las integraciones.",
  },
];

/** "Casos de uso" — collapsible editorial list, each entry linking to its service. */
export default function CasosDeUso() {
  const casos = CASOS.map((caso) => {
    const service = getService(caso.serviceSlug);
    const Icon = service?.icon;
    return {
      ...caso,
      href: `/servicios/${caso.serviceSlug}`,
      serviceTitle: service?.title ?? "Ver servicio",
      icon: Icon ? <Icon className="h-9 w-9" strokeWidth={1.5} /> : null,
    };
  });

  return (
    <section
      id="casos-de-uso"
      className="relative border-y border-white/10 bg-black/20 py-20"
    >
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-purple-300">
            Casos de uso
          </p>
          <h2 className="tp-heading font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Lo que hemos resuelto
          </h2>
          <p className="mt-4 max-w-xl text-lg font-light text-gray-400">
            Problemas reales de clientes reales. Toca cada uno para ver el detalle.
          </p>
        </Reveal>

        <div className="mt-10 border-t border-white/10">
          {casos.map((caso, i) => (
            <Reveal key={caso.serviceSlug} delay={i * 0.06}>
              <details
                open={i === 0}
                className="group border-b border-white/10 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 py-5">
                  <span className="font-heading text-2xl font-extrabold tabular-nums text-white/20 transition-colors duration-300 group-open:text-brand-blue/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-white transition-colors duration-300 group-hover:text-brand-blue sm:text-lg">
                      {caso.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
                      <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{caso.icon}</span>
                      {caso.serviceTitle}
                    </span>
                  </span>
                  <Plus className="h-4 w-4 shrink-0 text-brand-blue transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <div className="pb-6 pl-12 sm:pl-14">
                  <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
                    {caso.description}
                  </p>
                  <Link
                    href={caso.href}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue"
                  >
                    Ver {caso.serviceTitle}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 text-center">
            <Link
              href="/servicios"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-300 transition-colors hover:text-brand-blue"
            >
              Ver todos los servicios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
