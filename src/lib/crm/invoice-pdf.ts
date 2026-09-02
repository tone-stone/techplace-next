import { formatCurrencyMXN } from "./format";
import {
  ACCENT,
  INK,
  MUTED,
  drawClientBlock,
  drawFooter,
  drawHeader,
  drawTotals,
  loadBrandLogo,
} from "./pdf-branding";

/**
 * Client-side "recibo de cobro" export — an invoice-styled receipt to hand to
 * the client, used by the "PDF" buttons in Cobranza and Facturación. Not a
 * CFDI. jsPDF / jspdf-autotable are dynamically imported inside the function
 * so they only load on a real user click and never land in a server bundle.
 * Shares its look with the cotización PDF (see `pdf-branding.ts`).
 */

export type InvoiceTicket = {
  /** Folio, e.g. "TP-0007". */
  number: string;
  issuedDate: string;
  dueDate: string;
  amount: number;
  /** Invoice status word: "enviada" / "pagada" / … */
  status: string;
  company: string;
  contactName: string | null;
  /** What's being charged — the plan name, or a plain "Cobro". */
  concept: string;
  method: string | null;
  /**
   * IVA rate (%). When > 0 the total is treated as tax-included and broken out
   * into subtotal + IVA; when 0/omitted only the total is shown.
   */
  taxRate?: number;
};

/** Renders an A4 invoice-style receipt and triggers a browser download (`<folio>.pdf`). */
export async function downloadInvoiceTicketPdf(t: InvoiceTicket): Promise<void> {
  const [{ default: jsPDF }, { autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadBrandLogo(),
  ]);

  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  const M = 16;

  let y = drawHeader(doc, {
    W,
    M,
    logo,
    title: "RECIBO DE COBRO",
    metaRows: [
      ["Folio", t.number],
      ["Emitida", t.issuedDate],
      ["Vence", t.dueDate],
      ["Estado", t.status.toUpperCase()],
    ],
  });

  y = drawClientBlock(doc, {
    M,
    y,
    company: t.company,
    sub: t.contactName ? `Atención: ${t.contactName}` : null,
  });

  const taxRate = t.taxRate && t.taxRate > 0 ? t.taxRate : 0;
  const subtotal = taxRate ? t.amount / (1 + taxRate / 100) : t.amount;
  const tax = t.amount - subtotal;

  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Concepto", "Cant.", "P. unitario", "Importe"]],
    body: [[t.concept, "1", formatCurrencyMXN(subtotal), formatCurrencyMXN(subtotal)]],
    styles: { fontSize: 9, cellPadding: 3, textColor: INK },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 18 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 32 },
    },
    theme: "striped",
  });

  const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  let ty = drawTotals(doc, {
    W,
    M,
    y: afterTable,
    rows: taxRate
      ? [
          ["Subtotal", subtotal],
          [`IVA (${taxRate}%)`, tax],
        ]
      : [],
    total: t.amount,
  });

  if (t.method) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Método de pago: ${t.method}`, M, ty);
    ty += 6;
  }

  drawFooter(doc, {
    W,
    M,
    note: "Comprobante interno · no es un CFDI. Para tu factura fiscal solicítala con tus datos.",
  });

  doc.save(`${t.number}.pdf`);
}
