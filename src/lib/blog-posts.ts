/**
 * Blog category metadata shared by both the public blog pages and the
 * dashboard: the fixed list of categories with their icons, and a date
 * formatter for displaying an article's publish date in Spanish.
 */

import {
  BrainCircuit,
  Network,
  Server,
  ShieldCheck,
  Smartphone,
  SquareCode,
  type LucideIcon,
} from "lucide-react";

/** Icon shown for each blog category, keyed by the category's display name. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Ciberseguridad: ShieldCheck,
  "Desarrollo Web": SquareCode,
  "Desarrollo Móvil": Smartphone,
  "Inteligencia Artificial": BrainCircuit,
  "Hosting & Infraestructura": Server,
  "Consultoría IT": Network,
};

/**
 * Fixed list of blog categories, derived from `CATEGORY_ICONS`'s keys —
 * used to populate the category filter and the article form's category
 * select.
 */
export const CATEGORIES = Object.keys(CATEGORY_ICONS);

/**
 * Formats an ISO `YYYY-MM-DD` date string as a long-form Spanish date (e.g.
 * "27 de agosto de 2026") for display on blog cards and post pages.
 */
export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
