import Image from "next/image";
import Reveal from "./Reveal";

const ESPECIALIDADES = [
  {
    title: "Cyberseguridad & Infraestructura",
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
    title: "Consultoría & Innovación Digital",
    description:
      "Te asesoramos para impulsar tu transformación tecnológica, acompañándote en migraciones, optimización de IT, adopción de nuevas herramientas y decisiones estratégicas.",
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
  "Innovación constante",
  "Ética profesional",
  "Transparencia total",
  "Seguridad desde el inicio",
];

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
            En TechPlace reunimos un{" "}
            <span className="text-purple-400 font-semibold">equipo multidisciplinario</span>{" "}
            apasionado por la tecnología, la seguridad y el diseño. Nuestra fortaleza está en la{" "}
            <span className="text-purple-400">innovación digital</span> y en crear experiencias web y
            móviles seguras, eficientes y visualmente impactantes.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
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

        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
          <Reveal className="text-left max-w-lg" y={0}>
            <h4 className="text-2xl font-bold text-white mb-2">Nuestra Misión</h4>
            <p className="text-gray-300 mb-4 text-justify">
              Impulsar la transformación de negocios y personas a través de la{" "}
              <span className="text-purple-400 font-semibold">innovación tecnológica</span> y la{" "}
              <span className="text-purple-400 font-semibold">protección digital</span>, creando soluciones seguras,
              eficientes y visualmente sobresalientes.
            </p>
            <h4 className="text-2xl font-bold text-white mt-6 mb-2">Cultura TechPlace</h4>
            <ul className="text-gray-400 space-y-1 text-base ml-4 list-disc">
              {CULTURA.map((item) => (
                <li
                  key={item}
                  className="hover:translate-x-2 hover:text-purple-400 transition-all duration-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="w-full md:w-72" delay={0.15} y={0}>
            <Image
              src="/img/logos/techplace-brand.webp"
              alt="logo"
              width={288}
              height={288}
              className="tp-branding-img w-full h-auto"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
