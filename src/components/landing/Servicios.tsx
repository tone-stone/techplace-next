import Reveal from "./Reveal";
import ServiceCard from "./ServiceCard";
import MobileAccordion from "./MobileAccordion";
import { SERVICES } from "@/lib/services/catalog";

/**
 * Landing section (`#servicios`) listing TechPlace's service offerings.
 * Reads from the shared `SERVICES` catalog (`@/lib/services/catalog`) so the
 * card copy lives in the same place as each service's `/servicios/[slug]`
 * detail page. Presents the same data two ways depending on viewport: a card
 * grid on desktop (`ServiceCard`) and a one-open-at-a-time accordion on
 * mobile (`MobileAccordion`).
 */

/** Services section with a responsive card grid / accordion layout. */
export default function Servicios() {
  const cards = SERVICES.map((service) => {
    const Icon = service.icon;
    return {
      slug: service.slug,
      icon: <Icon className="h-12 w-12" strokeWidth={1.75} />,
      title: service.title,
      description: service.cardDescription,
      linkHref: `/servicios/${service.slug}`,
      linkLabel: service.cardCtaLabel,
    };
  });

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
            Desarrollo full-stack, seguridad e infraestructura bajo un mismo
            equipo de ingeniería, con inteligencia artificial aplicada en todo el
            ciclo: del diseño y el código a la automatización de tu operación.
            Cada proyecto se dimensiona a la medida de los objetivos de tu
            empresa y de su crecimiento futuro.
          </p>
        </Reveal>
        {/* Desktop: grid of cards. Mobile: one-open-at-a-time accordion. */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {cards.map((service, i) => (
            <Reveal key={service.slug} delay={i * 0.12}>
              <ServiceCard {...service} />
            </Reveal>
          ))}
        </div>
        <MobileAccordion
          className="sm:hidden"
          items={cards.map((service) => ({
            id: service.slug,
            title: service.title,
            icon: service.icon,
            body: (
              <>
                <p className="mb-4 text-justify">{service.description}</p>
                <a
                  href={service.linkHref}
                  className="inline-flex items-center font-semibold text-brand-blue hover:underline"
                >
                  {service.linkLabel} →
                </a>
              </>
            ),
          }))}
        />
      </div>
    </section>
  );
}
