/**
 * Portfolio projects, shared by the landing `Portafolio` carousel and the
 * per-service pages at `/servicios/[slug]`.
 *
 * `services` is the explicit list of service slugs a project appears under on
 * the service detail pages — edit it to control that mapping (it is not
 * derived from `tags`, which are display-only labels on the landing
 * carousel). `hideFromCarousel` keeps an entry off the landing carousel while
 * still showing it on its service page(s) — used for our own site and for
 * confidential work.
 */
export type Project = {
  image: string;
  title: string;
  description: string;
  tags: string[];
  url: string;
  /** Service slugs (from `@/lib/services/catalog`) this project appears under. */
  services: string[];
  /** Keep this entry out of the landing carousel. */
  hideFromCarousel?: boolean;
};

export const PROJECTS: Project[] = [
  {
    image: "/img/portfolio/tijuana-innovadora.webp",
    title: "Tijuana Innovadora",
    description: "Sitio institucional para movimiento ciudadano de arte, ciencia y tecnología.",
    tags: ["Desarrollo web", "Sitio institucional"],
    url: "https://tijuanainnovadora.org/",
    services: ["desarrollo-web", "hosting", "ciberseguridad"],
  },
  {
    image: "/img/portfolio/property-dreamz.webp",
    title: "Property Dreamz",
    description: "Plataforma inmobiliaria bilingüe para bienes raíces en México.",
    tags: ["Desarrollo web", "Plataforma inmobiliaria", "Bilingüe"],
    url: "https://www.propertydreamz.com/",
    services: ["desarrollo-web", "hosting", "ciberseguridad", "inteligencia-artificial"],
  },
  {
    image: "/img/portfolio/noticias33.webp",
    title: "Noticias 33",
    description: "Portal de noticias de México y el mundo.",
    tags: ["Desarrollo web", "Portal de noticias"],
    url: "https://noticias33.com/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/portfolio/old-souls.webp",
    title: "Old Souls Restaurante",
    description: "Desarrollo web, seguridad, experiencia industrial.",
    tags: ["Desarrollo web", "Ciberseguridad", "Experiencia industrial"],
    url: "https://www.oldsoulsrestaurante.com/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/portfolio/edie.webp",
    title: "Escuela de Ingles Especializada",
    description: "Desarrollo web y SEO local.",
    tags: ["Desarrollo web", "SEO local"],
    url: "https://industrialbajasupply.com/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/portfolio/cervantes.webp",
    title: "Cervantes Quijano Abogados",
    description: "Admin web + correo empresarial seguro.",
    tags: ["Panel administrativo", "Correo empresarial", "Seguridad"],
    url: "https://prosin.com.mx/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/portfolio/prosin.webp",
    title: "PROSIN",
    description: "Desarrollo web, seguridad, experiencia industrial.",
    tags: ["Desarrollo web", "Ciberseguridad", "Experiencia industrial"],
    url: "https://www.oldsoulsrestaurante.com/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/portfolio/rentas.webp",
    title: "Rentas TJ",
    description: "Desarrollo web y SEO local.",
    tags: ["Desarrollo web", "SEO local"],
    url: "https://industrialbajasupply.com/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/portfolio/bel-industrial.webp",
    title: "BelIndusrial",
    description: "Admin web + correo empresarial seguro.",
    tags: ["Panel administrativo", "Correo empresarial", "Seguridad"],
    url: "https://prosin.com.mx/",
    services: ["desarrollo-web", "hosting"],
  },
  {
    image: "/img/logos/techplace-brand.webp",
    title: "TechPlace",
    description: "Nuestro propio sitio: hardening, monitoreo y pruebas de seguridad continuas.",
    tags: ["Ciberseguridad", "Hardening"],
    url: "https://techplacetj.com",
    services: ["ciberseguridad"],
    hideFromCarousel: true,
  },
];

/** Projects shown in the landing carousel (everything not explicitly hidden). */
export const CAROUSEL_PROJECTS: Project[] = PROJECTS.filter((p) => !p.hideFromCarousel);

/** Projects to show on a given service's detail page. */
export function getProjectsForService(slug: string): Project[] {
  return PROJECTS.filter((p) => p.services.includes(slug));
}
