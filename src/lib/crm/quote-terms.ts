/**
 * Executive / legal legends printed on every quote — both the PDF export
 * (`quote-pdf.ts`) and the on-screen preview (`QuotePreview.tsx`). A quote may
 * override them with its own `terms` text; when it doesn't, `DEFAULT_QUOTE_TERMS`
 * is used. Pure module (no `"use server"`) so it can be imported from the
 * server action file and from client PDF code alike.
 */

/** One legend per line. Editable per-quote via the "Condiciones" textarea. */
export const DEFAULT_QUOTE_TERMS = [
  "Precios expresados en pesos mexicanos (MXN).",
  "Esta cotización está sujeta a cambios sin previo aviso.",
  "Vigencia: 30 días naturales a partir de la fecha de emisión, salvo que se indique otra fecha.",
  "No incluye conceptos, licencias ni servicios de terceros que no estén listados.",
  "Los tiempos de entrega se confirman al aceptar la cotización y cubrir el anticipo acordado.",
  "Documento informativo — no constituye un comprobante fiscal (CFDI).",
].join("\n");

/** Splits a terms blob (custom or default) into trimmed, non-empty lines. */
export function quoteTermsLines(terms: string | null | undefined): string[] {
  const source = terms && terms.trim() ? terms : DEFAULT_QUOTE_TERMS;
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
