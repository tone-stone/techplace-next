import { BrainCircuit, Network, Server, ShieldCheck, Smartphone, SquareCode } from "lucide-react";
import Reveal from "./Reveal";
import ServiceCard from "./ServiceCard";
import MobileAccordion from "./MobileAccordion";

/**
 * Landing section (`#servicios`) listing TechPlace's service offerings.
 * Presents the same data two ways depending on viewport: a card grid on
 * desktop (`ServiceCard`) and a one-open-at-a-time accordion on mobile
 * (`MobileAccordion`).
 */
const SERVICES = [
  {
    icon: <SquareCode className="h-12 w-12" strokeWidth={1.75} />,
    title: "Desarrollo web a la medida",
    description:
      "Sitios corporativos, plataformas y sistemas de gestión como CRM y paneles administrativos. Arquitectura moderna con React, Next.js y Node.js, despliegue en Vercel y bases de datos PostgreSQL, MySQL o MongoDB. Desarrollo asistido por IA para entregar más rápido, con rendimiento, escalabilidad y optimización para buscadores.",
    linkHref: "#portafolio",
    linkLabel: "Ver proyectos",
  },
  {
    icon: <BrainCircuit className="h-12 w-12" strokeWidth={1.75} />,
    title: "Inteligencia artificial y automatización",
    description:
      "Aplicamos IA en dos frentes: aceleramos el desarrollo de tu proyecto con herramientas de última generación, y construimos soluciones inteligentes para tu operación —asistentes y chatbots, generación y análisis de contenido, y automatizaciones a la medida que reducen costos y tiempos de entrega.",
    linkHref: "#contacto",
    linkLabel: "Agenda una reunión",
  },
  {
    icon: <Smartphone className="h-12 w-12" strokeWidth={1.75} />,
    title: "Desarrollo de aplicaciones móviles",
    description:
      "Aplicaciones para iOS, Android y Web desde una única base de código con React Native: soluciones de negocio, notificaciones push e integración con sistemas y APIs corporativas. Gestionamos la publicación en App Store y Google Play y el mantenimiento evolutivo.",
    linkHref: "#contacto",
    linkLabel: "Solicita tu cotización",
  },
  {
    icon: <ShieldCheck className="h-12 w-12" strokeWidth={1.75} />,
    title: "Ciberseguridad y pentesting",
    description:
      "Pruebas de penetración, análisis de vulnerabilidades y auditorías de seguridad sobre aplicaciones e infraestructura. Hardening de servidores Linux, revisión de redes, migraciones seguras y controles con Git y Docker. Entregamos un informe ejecutivo con hallazgos priorizados y plan de remediación.",
    linkHref: "#contacto",
    linkLabel: "Solicita una auditoría",
  },
  {
    icon: <Server className="h-12 w-12" strokeWidth={1.75} />,
    title: "Hosting y correo empresarial",
    description:
      "Administración de hosting, dominios y servidores VPS en Vercel, AWS o Google Cloud, junto con correo corporativo bajo tu dominio en Google Workspace o Microsoft 365. Infraestructura gestionada, monitoreada y respaldada.",
    linkHref: "#contacto",
    linkLabel: "Solicita tu cotización",
  },
  {
    icon: <Network className="h-12 w-12" strokeWidth={1.75} />,
    title: "Consultoría IT",
    description:
      "Diagnóstico tecnológico, definición de arquitectura (monolito o microservicios), planificación de migraciones y acompañamiento en la adopción de nuevas plataformas, minimizando riesgos y sobrecostos.",
    linkHref: "#contacto",
    linkLabel: "Agenda una asesoría",
  },
];

/** Services section with a responsive card grid / accordion layout. */
export default function Servicios() {
  return (
    <section id="servicios" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">
            Nuestros servicios
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg font-light mb-14 text-justify">
            Desarrollo, seguridad e infraestructura bajo un mismo equipo de
            ingeniería, con inteligencia artificial aplicada en todo el ciclo:
            del diseño y el código a la automatización de tu operación. Cada
            proyecto se dimensiona a la medida de los objetivos de tu empresa y
            de su crecimiento futuro.
          </p>
        </Reveal>
        {/* Desktop: grid of cards. Mobile: one-open-at-a-time accordion. */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.12}>
              <ServiceCard {...service} />
            </Reveal>
          ))}
        </div>
        <MobileAccordion
          className="sm:hidden"
          items={SERVICES.map((service) => ({
            id: service.title,
            title: service.title,
            icon: service.icon,
            body: (
              <>
                <p className="mb-4 text-justify">{service.description}</p>
                <a
                  href={service.linkHref}
                  className="inline-flex items-center font-semibold text-brand-blue hover:underline"
                >
                  {service.linkLabel}
                </a>
              </>
            ),
          }))}
        />
      </div>
    </section>
  );
}
