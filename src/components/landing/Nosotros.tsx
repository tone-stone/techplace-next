import Image from "next/image";
import { Sparkles, Target } from "lucide-react";
import Reveal from "./Reveal";
import MobileAccordion from "./MobileAccordion";

const ESPECIALIDADES = [
  {
    title: "Ciberseguridad e infraestructura",
    description:
      "Nos especializamos en proteger datos, redes y sistemas ante amenazas digitales, implementando controles de seguridad, hardening, monitoreo constante y respuesta ante incidentes.",
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
        <path
          d="M24 4L8 10v10c0 10.25 6.75 19.07 16 22 9.25-2.93 16-11.75 16-22V10L24 4Z"
          stroke="#a78bfa"
          strokeWidth="2.2"
          fill="none"
        />
        <circle cx="24" cy="24" r="6" stroke="#c4b5fd" strokeWidth="2.2" fill="none" />
        <rect x="22" y="25" width="4" height="6" rx="2" fill="#a78bfa" />
      </svg>
    ),
  },
  {
    title: "Desarrollo Web & UX/UI",
    description:
      "Creamos sitios web premium, optimizados y seguros, con un diseño minimalista centrado en la experiencia del usuario que integra arte y tecnología.",
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
        <rect x="6" y="10" width="36" height="22" rx="4" stroke="#a78bfa" strokeWidth="2.2" fill="none" />
        <rect x="20" y="34" width="8" height="4" rx="2" fill="#a78bfa" />
        <path
          d="M30 20c1.5 0 3.5 2 3.5 4s-2 4-3.5 4c-1.5 0-3.5-2-3.5-4s2-4 3.5-4Z"
          stroke="#c4b5fd"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    ),
  },
  {
    title: "Desarrollo Móvil & Apps",
    description:
      "Desarrollamos apps multiplataforma con React Native a partir de una sola base de código para iOS, Android y Web, logrando rendimiento nativo y ciclos de entrega ágiles.",
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
        <rect x="15" y="5" width="18" height="38" rx="4" stroke="#a78bfa" strokeWidth="2.2" fill="none" />
        <line x1="15" y1="12" x2="33" y2="12" stroke="#a78bfa" strokeWidth="2.2" />
        <line x1="15" y1="34" x2="33" y2="34" stroke="#a78bfa" strokeWidth="2.2" />
        <circle cx="24" cy="38.5" r="1.6" fill="#c4b5fd" />
        <rect x="19" y="17" width="5" height="5" rx="1.2" stroke="#c4b5fd" strokeWidth="1.8" />
        <rect x="25.5" y="17" width="5" height="5" rx="1.2" stroke="#c4b5fd" strokeWidth="1.8" />
        <rect x="19" y="23.5" width="5" height="5" rx="1.2" stroke="#c4b5fd" strokeWidth="1.8" />
        <rect x="25.5" y="23.5" width="5" height="5" rx="1.2" stroke="#c4b5fd" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: "Inteligencia Artificial & Automatización",
    description:
      "Integramos IA en tu operación y en nuestro propio proceso de desarrollo: asistentes, automatizaciones a la medida y adopción guiada de nuevas herramientas para acelerar resultados.",
    icon: (
      <svg width="48" height="48" fill="none" viewBox="0 0 48 48">
        <circle cx="16" cy="24" r="4" stroke="#a78bfa" strokeWidth="2.2" />
        <circle cx="32" cy="16" r="4" stroke="#c4b5fd" strokeWidth="2.2" />
        <circle cx="32" cy="32" r="4" stroke="#a78bfa" strokeWidth="2.2" />
        <path d="M20 24h8m4-4v8m-12-4l8-8m-8 8l8 8" stroke="#a78bfa" strokeWidth="2.2" />
      </svg>
    ),
  },
];

const CULTURA = [
  "Minimalismo funcional",
  "Arte & Diseño UX/UI",
  "Desarrollo asistido por IA",
  "Ética profesional",
  "Transparencia total",
  "Seguridad desde el inicio",
];

/**
 * The "¿Quiénes Somos?" section (`#nosotros`): company intro copy, a grid of
 * specialty areas (accordion on mobile), and a two-column mission/culture
 * summary alongside the brand image.
 */
export default function Nosotros() {
  return (
    <section
      id="nosotros"
      className="relative py-20 border-t border-white/10 overflow-x-hidden"
    >
      <div className="max-w-5xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="tp-heading font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-tight drop-shadow-xl">
            ¿Quiénes Somos?
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-10 text-gray-300 text-lg md:text-xl font-light text-justify">
            TechPlace es una{" "}
            <span className="text-purple-400 font-semibold">firma de ingeniería digital</span>{" "}
            con base en Tijuana, especializada en desarrollo de software, ciberseguridad e{" "}
            <span className="text-purple-400 font-semibold">inteligencia artificial aplicada</span>.
            Construimos soluciones{" "}
            <span className="text-purple-400">escalables y seguras desde su concepción</span>, con
            IA integrada en nuestro proceso de trabajo, para empresas, despachos profesionales y
            startups de Baja California y todo México.
          </p>
        </Reveal>

        {/* Desktop: grid of cards. Mobile: one-open-at-a-time accordion. */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {ESPECIALIDADES.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.12}>
              <div className="tp-glass tp-glass-hover rounded-2xl p-8 flex flex-col items-center group transition-all duration-300 hover:-translate-y-1">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-gray-300 text-sm mt-2 text-justify">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <MobileAccordion
          className="sm:hidden mb-16"
          items={ESPECIALIDADES.map((item) => ({
            id: item.title,
            title: item.title,
            icon: item.icon,
            body: <p className="text-justify">{item.description}</p>,
          }))}
        />

        <Reveal className="mb-10 flex justify-center" y={0}>
          <Image
            src="/img/logos/techplace-brand.webp"
            alt="TechPlace — desarrollo web, apps y ciberseguridad en Tijuana"
            width={288}
            height={288}
            className="tp-branding-img w-48 h-auto sm:w-56 md:w-64"
          />
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          <Reveal y={0}>
            <div className="tp-glass tp-glass-hover flex h-full flex-col rounded-2xl p-8 text-left">
              <span className="mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-500/15">
                <Target className="h-6 w-6 text-purple-300" strokeWidth={1.75} />
              </span>
              <h3 className="text-2xl font-bold text-white mb-3">Nuestra Misión</h3>
              <p className="text-gray-300 text-justify leading-relaxed">
                Impulsar el crecimiento de organizaciones y personas mediante{" "}
                <span className="text-purple-400 font-semibold">inteligencia artificial</span>,{" "}
                <span className="text-purple-400 font-semibold">tecnología de vanguardia</span> y{" "}
                <span className="text-purple-400 font-semibold">protección digital</span>, entregando
                soluciones seguras, eficientes y con estándares de calidad empresarial.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} y={0}>
            <div className="tp-glass tp-glass-hover flex h-full flex-col rounded-2xl p-8 text-left">
              <span className="mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/15">
                <Sparkles className="h-6 w-6 text-indigo-300" strokeWidth={1.75} />
              </span>
              <h3 className="text-2xl font-bold text-white mb-4">Cultura TechPlace</h3>
              <div className="flex flex-wrap gap-2.5">
                {CULTURA.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-gray-300 transition-colors duration-200 hover:border-indigo-400/40 hover:text-indigo-300"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
