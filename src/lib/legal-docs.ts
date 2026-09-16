/**
 * Registry of the site's static legal documents. Each entry maps a
 * `/legal/[slug]` page to the title and blurb shown for it on the `/legal`
 * index and in the Footer's "Legal" link list.
 */
export type LegalDoc = {
  slug: string;
  title: string;
  description: string;
};

/**
 * Shared between the /legal index page and the Footer's "Legal" link list,
 * so adding or renaming a document only happens in one place.
 */
export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terminos",
    title: "Términos y Condiciones",
    description: "Reglas de uso de este sitio web y del portal de blog.",
  },
  {
    slug: "privacidad",
    title: "Aviso de Privacidad",
    description: "Qué datos personales recabamos y cómo los tratamos, conforme a la LFPDPPP.",
  },
  {
    slug: "licencia",
    title: "Contrato de Licencia de Software",
    description: "Términos bajo los que se licencia el software desarrollado por TechPlace.",
  },
  {
    slug: "encargo-tratamiento-datos",
    title: "Contrato de Encargo de Tratamiento de Datos",
    description: "Obligaciones de TechPlace como encargado cuando trata datos por cuenta de un cliente.",
  },
  {
    slug: "desarrollo-a-medida",
    title: "Contrato de Desarrollo a la Medida",
    description: "Modelo de contrato para proyectos de software a la medida, con cesión de derechos.",
  },
];
