/**
 * Service detail page — renders one service from the `SERVICES` catalog at
 * `/servicios/[slug]`. Every slug is a fixed, statically-generated route
 * (`generateStaticParams` + `dynamicParams = false`); unknown slugs 404.
 *
 * A `published` service renders the full layout (what we build, process,
 * stack, pricing, FAQ). An unpublished one renders a short placeholder with
 * just the hero, intro, and a CTA.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import {
  SERVICES,
  getService,
  formatMXN,
  formatUSD,
  type ServicePackage,
} from "@/lib/services/catalog";
import { getProjectsForService } from "@/lib/portfolio";

export const dynamicParams = false;

/** One static route per service in the catalog. */
export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  const url = `/servicios/${service.slug}`;
  const title = `${service.title} | TechPlace`;

  return {
    title,
    description: service.tagline,
    keywords: [service.title, "TechPlace", "Tijuana", "desarrollo de software"],
    alternates: { canonical: url },
    openGraph: {
      title: service.title,
      description: service.tagline,
      url,
      type: "website",
      images: ["/img/logos/techplace-brand.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: service.title,
      description: service.tagline,
      images: ["/img/logos/techplace-brand.webp"],
    },
  };
}

/** Price line for one package: MXN as the headline, USD as an aside. */
function PackagePrice({ pkg }: { pkg: ServicePackage }) {
  if (pkg.priceMXN === null || pkg.priceUSD === null) {
    return <p className="text-2xl font-extrabold text-white">A cotización</p>;
  }
  const suffix = pkg.period ? ` / ${pkg.period}` : "";
  return (
    <div>
      <p className="text-sm text-gray-400">Desde</p>
      <p className="text-2xl font-extrabold text-white">
        {formatMXN(pkg.priceMXN)}
        {suffix && <span className="text-base font-semibold text-gray-400">{suffix}</span>}
      </p>
      <p className="text-sm text-gray-400">
        ≈ {formatUSD(pkg.priceUSD)}
        {suffix}
      </p>
    </div>
  );
}

/** Compact MXN label for the market bar, e.g. 120000 -> "$120k". */
function shortMXN(n: number): string {
  return n >= 1000
    ? `$${(n / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })}k`
    : `$${n}`;
}

/**
 * "Comparativa de mercado": a range bar showing where this package's price
 * sits within the comparable Mexican-market range, for the client to see.
 */
function MarketCompare({ pkg }: { pkg: ServicePackage }) {
  if (pkg.marketLow == null || pkg.marketHigh == null) return null;
  const { marketLow: lo, marketHigh: hi, priceMXN: price } = pkg;
  const range = `${shortMXN(lo)} – ${shortMXN(hi)}${pkg.marketPlus ? "+" : ""}`;
  const pct =
    price == null ? null : Math.min(96, Math.max(4, ((price - lo) / (hi - lo)) * 100));
  const periodLabel = pkg.period ? ` / ${pkg.period}` : "";

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        <span>
          Mercado en México <span className="text-brand-blue">*</span>
        </span>
        <span>
          {range}
          {periodLabel}
        </span>
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
        {pct !== null && (
          <>
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-brand-blue/40"
              style={{ width: `${pct}%` }}
            />
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue ring-2 ring-black/40"
              style={{ left: `${pct}%` }}
            />
          </>
        )}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        {pct !== null ? (
          <>
            <span className="font-bold text-brand-blue">●</span> Nuestro precio:{" "}
            {formatMXN(price!)}
            {periodLabel} — en la banda {pct < 45 ? "baja" : pct < 65 ? "media" : "media-alta"} del
            mercado
          </>
        ) : (
          "Se cotiza según el alcance del proyecto."
        )}
      </p>
    </div>
  );
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const Icon = service.icon;
  const projects = getProjectsForService(slug);

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.tagline,
    serviceType: service.title,
    provider: {
      "@type": "Organization",
      name: "TechPlace",
      url: "https://techplacetj.com",
    },
    areaServed: "MX",
    url: `https://techplacetj.com/servicios/${service.slug}`,
  };

  // FAQPage schema — mirrors the visible "Preguntas frecuentes" section so
  // Google can surface the Q&As as a rich result.
  const faqLd =
    service.faqs && service.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: service.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/#servicios"
          className="inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-brand-blue transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Todos los servicios
        </Link>

        {/* Hero */}
        <header className="mb-14">
          <div className="tp-icon-glow mb-6 text-purple-300">
            <Icon className="h-14 w-14" strokeWidth={1.75} />
          </div>
          <h1 className="tp-heading font-heading text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            {service.title}
          </h1>
          <p className="max-w-2xl text-lg text-gray-300 font-light">{service.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/#contacto"
              className="tp-btn-animated inline-block text-white px-7 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform duration-200"
            >
              Solicitar cotización
            </Link>
            {service.published && service.packages && (
              <a
                href="#paquetes"
                className="inline-flex items-center rounded-full border border-white/20 px-7 py-3 font-bold text-white hover:bg-white/5 transition-colors"
              >
                Ver paquetes y costos
              </a>
            )}
          </div>
        </header>

        {/* Cambiar de servicio — barra siempre visible cerca del inicio */}
        <nav
          aria-label="Otros servicios"
          className="-mx-4 mb-12 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SERVICES.map((other) => {
            const active = other.slug === service.slug;
            return (
              <Link
                key={other.slug}
                href={`/servicios/${other.slug}`}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-brand-blue/60 bg-brand-blue/15 text-brand-blue"
                    : "border-white/15 bg-white/5 text-gray-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {other.title}
              </Link>
            );
          })}
        </nav>

        {/* Intro */}
        <section className="tp-dark-card rounded-3xl p-6 sm:p-10 space-y-5 text-gray-300 leading-relaxed [&_p]:text-justify">
          {service.intro.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </section>

        {!service.published && (
          <p className="mt-8 text-center text-sm text-gray-400">
            ¿Necesitas este servicio hoy?{" "}
            <Link href="/#contacto" className="font-bold text-brand-blue hover:underline">
              Escríbenos
            </Link>{" "}
            y te preparamos una propuesta.
          </p>
        )}

        {/* Qué desarrollamos */}
        {service.whatWeBuild && service.whatWeBuild.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-8">
              Qué hacemos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {service.whatWeBuild.map((item) => (
                <div key={item.title} className="tp-glass rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-300">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Soluciones / clientes — prueba de capacidad */}
        {service.showcase && service.showcase.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-2">
              {service.showcaseTitle ?? "Soluciones que hemos desarrollado"}
            </h2>
            <p className="mb-8 text-sm text-gray-400">
              {service.showcaseNote ??
                "Productos propios en producción — la mejor prueba de lo que podemos construir."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {service.showcase.map((item) => (
                <div key={item.name} className="tp-glass rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-300">{item.summary}</p>
                  {item.highlights && item.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {item.highlights.map((h) => (
                        <li key={h} className="flex gap-2 text-sm text-gray-300">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Casos de uso */}
        {service.useCases && service.useCases.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-2">Casos de uso</h2>
            <p className="mb-8 text-sm text-gray-400">
              Ejemplos de dónde encaja este servicio. Los nombres se omiten por confidencialidad.
            </p>
            <div className="space-y-4">
              {service.useCases.map((uc) => (
                <div key={uc.title} className="tp-glass rounded-2xl border-l-2 border-brand-blue/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-2">{uc.title}</h3>
                  <p className="text-sm text-gray-300">{uc.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Proyectos — casos del portafolio ligados a este servicio */}
        {projects.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-2">Proyectos</h2>
            <p className="mb-6 text-sm text-gray-400">
              Trabajos en producción donde este servicio fue parte de la entrega.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {projects.map((p) => (
                <a
                  key={p.title}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tp-glass tp-glass-hover group flex items-center gap-3 rounded-xl p-3 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-black/30">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      quality={75}
                      sizes="44px"
                      className="object-contain p-1"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-white transition-colors group-hover:text-brand-blue">
                      <span className="truncate">{p.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-gray-500" />
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Cómo trabajamos */}
        {service.howWeWork && service.howWeWork.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-8">
              Cómo trabajamos
            </h2>
            <ol className="space-y-4">
              {service.howWeWork.map((step, i) => (
                <li key={step.title} className="tp-glass flex gap-4 rounded-2xl p-6">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 font-heading font-bold text-brand-blue">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-300">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tecnologías */}
        {service.stack && service.stack.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-8">Tecnologías</h2>
            <div className="space-y-5">
              {service.stack.map((group) => (
                <div key={group.group}>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">
                    {group.group}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {group.items.map((tech) => (
                      <li
                        key={tech}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-gray-200"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Paquetes y costos */}
        {service.packages && service.packages.length > 0 && (
          <section id="paquetes" className="mt-16 scroll-mt-32">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-2">
              Paquetes y costos
            </h2>
            <p className="mb-8 text-sm text-gray-400">
              Cada paquete comparado con el precio de mercado en México (2025–2026).
              <span className="text-brand-blue"> *</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {service.packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`flex flex-col rounded-2xl p-6 ${
                    pkg.highlighted
                      ? "tp-glass ring-2 ring-brand-blue/60"
                      : "tp-glass"
                  }`}
                >
                  {pkg.highlighted && (
                    <span className="mb-3 self-start rounded-full bg-brand-blue/20 px-3 py-1 text-xs font-bold text-brand-blue">
                      Más solicitado
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  <p className="mt-1 mb-4 text-sm text-gray-400">{pkg.blurb}</p>
                  <PackagePrice pkg={pkg} />
                  <MarketCompare pkg={pkg} />
                  <ul className="mt-5 space-y-2">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-gray-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/#contacto"
                    className="mt-6 inline-block text-sm font-bold text-brand-blue hover:underline"
                  >
                    {pkg.priceMXN === null ? "Solicitar cotización" : "Empezar este paquete"} →
                  </Link>
                </div>
              ))}
            </div>
            {service.quoteNote && (
              <p className="mt-6 text-sm text-gray-400">{service.quoteNote}</p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              <span className="text-brand-blue">*</span> Rangos de referencia calculados a partir de
              listas de precios publicadas por despachos mexicanos (2025–2026): BastianSoft y
              Tiendanube (web y e-commerce); Creaun e iTechDev (apps); GNB Labs e IAmanos (IA y
              automatización); Genghis (ciberseguridad); Magokoro y Cronoshare (consultoría);
              Curotec y NoriHost (tarifas y licencias). Son precios anunciados, no una tarifa
              oficial de la industria.
            </p>
          </section>
        )}

        {/* Preguntas frecuentes */}
        {service.faqs && service.faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-8">
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {service.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="tp-glass group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-bold text-white">
                    {faq.q}
                    <span className="shrink-0 text-brand-blue transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-gray-300">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Otros servicios — navegación rápida al resto del catálogo */}
        <section className="mt-16">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold mb-6">Otros servicios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICES.filter((s) => s.slug !== service.slug).map((other) => {
              const OtherIcon = other.icon;
              return (
                <Link
                  key={other.slug}
                  href={`/servicios/${other.slug}`}
                  className="tp-glass tp-glass-hover group flex items-center gap-3 rounded-xl px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <OtherIcon className="h-6 w-6 shrink-0 text-purple-300" strokeWidth={1.75} />
                  <span className="flex-1 text-sm font-bold text-white group-hover:text-brand-blue transition-colors">
                    {other.title}
                  </span>
                  <span className="shrink-0 text-brand-blue">→</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA final */}
        <div className="mt-16 flex flex-col items-center text-center tp-dark-card rounded-3xl p-8">
          <p className="text-white text-lg font-light mb-4">
            ¿Tienes un proyecto en mente? Hablemos de cómo hacerlo realidad.
          </p>
          <Link
            href="/#contacto"
            className="tp-btn-animated inline-block text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:scale-105 transition-transform duration-200"
          >
            Solicita tu cotización
          </Link>
        </div>
      </div>
    </>
  );
}
