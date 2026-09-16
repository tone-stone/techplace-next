import Reveal from "./Reveal";
import MobileAccordion from "./MobileAccordion";

const RAZONES = [
  {
    title: "Equipo integral",
    description:
      "Desarrollo, seguridad, infraestructura y consultoría en un mismo proveedor. Un único interlocutor responsable de que todas las piezas operen en conjunto.",
    path: "M9 11l3 3L22 4M21 12.3v5.7A2 2 0 0 1 19 20H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11.3",
  },
  {
    title: "Seguridad desde el diseño",
    description:
      "La seguridad no es un añadido posterior: cada plataforma se construye con controles y buenas prácticas desde el inicio, y auditamos sistemas ya en producción.",
    path: "M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z",
  },
  {
    title: "Interlocución directa",
    description:
      "Trabajas directamente con el equipo de ingeniería que ejecuta tu proyecto, desde la planeación hasta la entrega y el soporte posterior.",
    path: "M18 8A6 6 0 0 0 6 8c0 6-3 7-3 7h18s-3-1-3-7",
    extraCircle: true,
  },
  {
    title: "Impulsados por inteligencia artificial",
    description:
      "Usamos IA de última generación en todo el flujo —diseño, código y pruebas— para entregar más rápido, con mejor calidad y a mejor costo. Sobre stacks estándar: React, Next.js, React Native y Node.js.",
    path: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
    extraPolyline: true,
  },
];

// Renders one RAZONES entry's inline SVG icon, including its optional extra shapes.
function RazonIcon({ razon }: { razon: (typeof RAZONES)[number] }) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d={razon.path} />
      {razon.extraCircle && <circle cx="12" cy="8" r="4" />}
      {razon.extraPolyline && <polyline points="13 2 13 9 20 9" />}
    </svg>
  );
}

/**
 * The "¿Por qué elegir TechPlace?" section (`#porque-techplace`): a grid of
 * differentiators (accordion on mobile) followed by a closing call to
 * action.
 */
export default function PorQueTechPlace() {
  return (
    <section
      id="porque-techplace"
      className="relative py-20 border-t border-white/10"
    >
      <div className="max-w-6xl mx-auto px-4">
        <Reveal>
          <h2 className="tp-heading font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-10 tracking-tight">
            ¿Por qué elegir <span className="text-brand-blue">TechPlace</span>?
          </h2>
        </Reveal>
        {/* Desktop: grid of cards. Mobile: one-open-at-a-time accordion. */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {RAZONES.map((razon, i) => (
            <Reveal key={razon.title} delay={i * 0.1}>
              <div className="tp-glass tp-glass-hover rounded-2xl p-8 flex flex-col items-center hover:scale-105 transition-all duration-300 group">
                <svg
                  className="h-12 w-12 mb-3 text-purple-300 group-hover:text-purple-400 transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d={razon.path} />
                  {razon.extraCircle && <circle cx="12" cy="8" r="4" />}
                  {razon.extraPolyline && <polyline points="13 2 13 9 20 9" />}
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">{razon.title}</h3>
                <p className="text-gray-300 text-base text-justify">{razon.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <MobileAccordion
          className="sm:hidden"
          items={RAZONES.map((razon) => ({
            id: razon.title,
            title: razon.title,
            icon: <RazonIcon razon={razon} />,
            body: <p className="text-justify">{razon.description}</p>,
          }))}
        />

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-col items-center">
            <p className="text-white text-lg font-light mb-4">
              Convierte tu proyecto en nuestro próximo caso de éxito.
            </p>
            <a
              href="#contacto"
              className="tp-btn-animated inline-block text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Solicita tu cotización
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
