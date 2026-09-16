/**
 * Rule-based first draft for a `CrmQuote` from a `ManagedBrief` — maps the
 * project type and the checkboxes the prospect picked to line items priced
 * off the public catalog (`src/lib/services/catalog.ts` /
 * `docs/precios-mercado.md`). This is a starting point for the team to
 * adjust, never sent as-is: `createQuoteAction` always lands the quote as
 * `borrador`, and the notes explicitly flag it as unreviewed.
 */
import type { ManagedBrief } from "./types";

export type SuggestedQuoteItem = { concept: string; quantity: number; unitPrice: number };

export type SuggestedQuote = {
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  items: SuggestedQuoteItem[];
  notes: string;
};

const PROJECT_TYPE_BASE: Record<string, SuggestedQuoteItem> = {
  "Landing page (una sola página enfocada en conversión)": {
    concept: "Landing page",
    quantity: 1,
    unitPrice: 12000,
  },
  "Sitio web corporativo / informativo (varias páginas)": {
    concept: "Sitio web corporativo",
    quantity: 1,
    unitPrice: 38000,
  },
  "Tienda en línea / E-commerce": { concept: "Tienda en línea / E-commerce", quantity: 1, unitPrice: 60000 },
  "Blog o sitio de contenido": { concept: "Sitio de contenido / blog", quantity: 1, unitPrice: 38000 },
  "Sistema o plataforma a medida (CMS, CRM, ERP, etc.)": {
    concept: "Plataforma a la medida — alcance a cerrar en descubrimiento",
    quantity: 1,
    unitPrice: 150000,
  },
  "Aplicación móvil": { concept: "Aplicación móvil (MVP)", quantity: 1, unitPrice: 60000 },
  "Rediseño de un sitio existente": { concept: "Rediseño de sitio existente", quantity: 1, unitPrice: 30000 },
  "No estoy seguro, necesito asesoría": {
    concept: "Diagnóstico y definición de alcance",
    quantity: 1,
    unitPrice: 9000,
  },
};

const FEATURE_ITEMS: Record<string, SuggestedQuoteItem> = {
  "Carrito de compras y pagos en línea": {
    concept: "Carrito de compras y pasarela de pago",
    quantity: 1,
    unitPrice: 15000,
  },
  "Registro e inicio de sesión de usuarios": {
    concept: "Cuentas de usuario (registro / login)",
    quantity: 1,
    unitPrice: 15000,
  },
  "Panel de administración": { concept: "Panel de administración a la medida", quantity: 1, unitPrice: 20000 },
  "Reservas o citas en línea": { concept: "Sistema de reservas / citas en línea", quantity: 1, unitPrice: 15000 },
  Multilenguaje: { concept: "Soporte multi-idioma", quantity: 1, unitPrice: 8000 },
  "Newsletter / email marketing": {
    concept: "Integración de newsletter / email marketing",
    quantity: 1,
    unitPrice: 4000,
  },
};

const INTEGRATION_ITEMS: Record<string, SuggestedQuoteItem> = {
  "Facturación electrónica (CFDI)": {
    concept: "Integración de facturación electrónica (CFDI)",
    quantity: 1,
    unitPrice: 10000,
  },
  "Sistema de inventario": { concept: "Integración con sistema de inventario", quantity: 1, unitPrice: 12000 },
  "CRM o ERP externo": { concept: "Integración con CRM/ERP externo", quantity: 1, unitPrice: 12000 },
  "Sistema de reservaciones o citas": {
    concept: "Integración con sistema de reservaciones/citas",
    quantity: 1,
    unitPrice: 10000,
  },
};

/** Features already covered by a base package, so picking both doesn't double-charge. */
const INCLUDED_BY_BASE: Partial<Record<string, string[]>> = {
  "Tienda en línea / E-commerce": ["Carrito de compras y pagos en línea"],
};

export function suggestQuoteFromBrief(brief: ManagedBrief): SuggestedQuote {
  const items: SuggestedQuoteItem[] = [];

  const base = PROJECT_TYPE_BASE[brief.projectType];
  if (base) items.push(base);

  const covered = new Set(INCLUDED_BY_BASE[brief.projectType] ?? []);
  for (const feature of brief.features) {
    if (covered.has(feature)) continue;
    const item = FEATURE_ITEMS[feature];
    if (item) items.push(item);
  }
  for (const integration of brief.integrations) {
    const item = INTEGRATION_ITEMS[integration];
    if (item) items.push(item);
  }
  if (items.length === 0) {
    items.push({ concept: "Alcance a definir", quantity: 1, unitPrice: 0 });
  }

  const notes = [
    `Borrador generado automáticamente a partir de la solicitud de ${brief.fullName}` +
      (brief.businessName ? ` (${brief.businessName})` : "") +
      ".",
    brief.problemToSolve ? `Contexto del cliente: ${brief.problemToSolve}` : null,
    `Presupuesto indicado por el cliente: ${brief.budgetRange}.`,
    `Tiempo esperado: ${brief.timeline}.`,
    "⚠ Revisa y ajusta las líneas y el total antes de enviar — es solo un punto de partida.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  return {
    clientName: brief.fullName,
    clientCompany: brief.businessName ?? "",
    clientEmail: brief.email,
    items,
    notes,
  };
}
