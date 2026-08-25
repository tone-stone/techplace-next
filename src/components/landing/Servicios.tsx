import { BrainCircuit, Network, Server, ShieldCheck, Smartphone, SquareCode } from "lucide-react";
import Reveal from "./Reveal";
import ServiceCard from "./ServiceCard";

const SERVICES = [
  {
    icon: <ShieldCheck className="h-12 w-12" strokeWidth={1.75} />,
    title: "Cyberseguridad",
    description:
      "Pentesting, análisis de vulnerabilidades y auditorías de seguridad, incluyendo auditorías de Google y posicionamiento SEO. Cubrimos seguridad de software y hardware: diagnósticos de red e infraestructura, migraciones seguras, Git, Docker, servidores Linux, Kali Linux y Python.",
    linkHref: "#contacto",
    linkLabel: "Consulta sin costo",
  },
  {
    icon: <SquareCode className="h-12 w-12" strokeWidth={1.75} />,
    title: "Desarrollo Web Full Stack",
    description:
      "Desde landing pages y blogs de noticias hasta sitios empresariales y aplicaciones web completas como CMS y CRM. Dominamos múltiples tecnologías, desde código puro hasta React, Next.js y Node.js, con despliegues en Vercel y bases de datos PostgreSQL, MySQL y MongoDB.",
    linkHref: "#portafolio",
    linkLabel: "Ver proyectos",
  },
  {
    icon: <Smartphone className="h-12 w-12" strokeWidth={1.75} />,
    title: "Desarrollo Móvil",
    description:
      "Construimos apps multiplataforma con React Native a partir de una sola base de código para iOS, Android y Web: apps para negocios, e-commerce móvil, notificaciones push e integración con APIs y sistemas externos. Nos encargamos de la publicación en App Store y Google Play, con un desarrollo ágil, rendimiento nativo y mantenimiento simplificado.",
    linkHref: "#contacto",
    linkLabel: "Cotiza tu app",
  },
  {
    icon: <BrainCircuit className="h-12 w-12" strokeWidth={1.75} />,
    title: "Automatización con IA",
    description:
      "Integramos inteligencia artificial en cada proyecto: usamos Claude, ChatGPT y Cursor para acelerar el desarrollo, aplicamos prompt engineering y diseñamos automatizaciones a la medida que optimizan procesos y reducen tiempos de entrega.",
    linkHref: "#contacto",
    linkLabel: "Conoce más",
  },
  {
    icon: <Server className="h-12 w-12" strokeWidth={1.75} />,
    title: "Hosting & Correo Empresarial",
    description:
      "Gestionamos hosting y dominios en Vercel, Hostinger y HostGator, además de servidores VPS en AWS y Google Cloud. Configuramos y administramos correo empresarial con Google Workspace, Microsoft 365 y alternativas de código abierto.",
    linkHref: "#contacto",
    linkLabel: "Cotiza tu hosting",
  },
  {
    icon: <Network className="h-12 w-12" strokeWidth={1.75} />,
    title: "Consultoría IT",
    description:
      "Te acompañamos en cada decisión tecnológica: desde el diagnóstico inicial hasta la arquitectura de software más adecuada (MVC, MVVM, monolitos o microservicios). Aplicamos metodologías ágiles y te asesoramos en la implementación e integración de nuevas tecnologías, evitando riesgos y sobrecostos.",
    linkHref: "#contacto",
    linkLabel: "¡Agenda tu asesoría!",
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="relative py-24">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-4xl md:text-5xl font-extrabold mb-14 tracking-tight drop-shadow-lg">
            Nuestros Servicios
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.12}>
              <ServiceCard {...service} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
