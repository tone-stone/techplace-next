import { Network, ShieldCheck, SquareCode } from "lucide-react";
import Reveal from "./Reveal";
import ServiceCard from "./ServiceCard";

const SERVICES = [
  {
    icon: <ShieldCheck className="h-12 w-12" strokeWidth={1.75} />,
    title: "Cyberseguridad",
    description:
      "Protección total contra amenazas digitales: auditorías, hardening, monitoreo 24/7, respuesta ante incidentes y capacitación personalizada.",
    linkHref: "#contacto",
    linkLabel: "Consulta sin costo",
  },
  {
    icon: <SquareCode className="h-12 w-12" strokeWidth={1.75} />,
    title: "Desarrollo Web",
    description:
      "Sitios y sistemas hechos a la medida, diseño responsive y animaciones modernas. Puro código (HTML, CSS, JS), rendimiento, SEO y mantenimiento mínimo.",
    linkHref: "#portafolio",
    linkLabel: "Ver proyectos",
  },
  {
    icon: <Network className="h-12 w-12" strokeWidth={1.75} />,
    title: "Consultoría IT",
    description:
      "Diagnóstico experto, migraciones cloud, optimización de infraestructura, redes seguras y correo empresarial. Soluciones flexibles y personalizadas.",
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
