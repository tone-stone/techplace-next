import Reveal from "./Reveal";

const RAZONES = [
  {
    title: "Experiencia & Calidad",
    description:
      "Equipo multidisciplinario con años de experiencia en desarrollo web y ciberseguridad. Soluciones hechas a medida con altos estándares.",
    path: "M9 11l3 3L22 4M21 12.3v5.7A2 2 0 0 1 19 20H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11.3",
  },
  {
    title: "Seguridad Digital Real",
    description:
      "Cuidamos tu información con protocolos avanzados, auditorías, monitoreo y prácticas de ciberseguridad de nivel empresarial.",
    path: "M12 22s8-4 8-10V7l-8-5-8 5v5c0 6 8 10 8 10z",
  },
  {
    title: "Atención Personalizada",
    description:
      "Te escuchamos y te acompañamos desde la planeación hasta la entrega final. ¡Cuentas con nuestro respaldo real!",
    path: "M18 8A6 6 0 0 0 6 8c0 6-3 7-3 7h18s-3-1-3-7",
    extraCircle: true,
  },
  {
    title: "Innovación Constante",
    description:
      "Usamos herramientas actuales y probadas, combinando creatividad y minimalismo para que tu negocio destaque.",
    path: "M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
    extraPolyline: true,
  },
];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                <p className="text-gray-300 text-base">{razon.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-col items-center">
            <p className="text-white text-lg font-light mb-4">
              Haz de tu proyecto un caso de éxito con TechPlace. ¡Tu confianza es nuestra mayor motivación!
            </p>
            <a
              href="#contacto"
              className="tp-btn-animated inline-block text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Solicita tu consultoría gratis
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
