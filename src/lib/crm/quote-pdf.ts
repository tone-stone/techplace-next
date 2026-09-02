import type { QuoteDetail } from "./quotes";
import { formatCurrencyMXN } from "./format";
import { quoteTermsLines } from "./quote-terms";
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
 * Client-side quote-to-PDF export, used by "Descargar PDF" in
 * `QuoteDetailModal`. Same A4 template as the recibo de cobro
 * (`pdf-branding.ts`): brand header + logo, client block, line-item table and
 * totals. jsPDF / jspdf-autotable load only on a real user click.
 */
export async function downloadQuotePdf(detail: QuoteDetail): Promise<void> {
  const [{ default: jsPDF }, { autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    loadBrandLogo(),
  ]);

  const { quote, items } = detail;
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  const M = 16;

  const metaRows: [string, string][] = [
    ["Folio", quote.number],
    ["Fecha", quote.issuedDate || quote.createdAt.slice(0, 10)],
    ["Estado", quote.status.toUpperCase()],
  ];
  if (quote.validUntil) metaRows.push(["Vigencia", quote.validUntil]);

  let y = drawHeader(doc, { W, M, logo, title: "COTIZACIÓN", metaRows });

  const contactBits = [quote.clientName, quote.clientEmail].filter(Boolean).join(" · ");
  y = drawClientBlock(doc, {
    M,
    y,
    company: quote.clientCompany || quote.clientName,
    sub: quote.clientCompany ? contactBits || null : quote.clientEmail,
  });

  autoTable(doc, {
    startY: y + 4,
    margin: { left: M, right: M },
    head: [["Concepto", "Cant.", "P. unitario", "Importe"]],
    body: items.map((it) => [
      it.concept,
      String(it.quantity),
      formatCurrencyMXN(it.unitPrice),
      formatCurrencyMXN(it.quantity * it.unitPrice),
    ]),
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
    rows: [
      ["Subtotal", quote.subtotal],
      [`IVA (${quote.taxRate}%)`, quote.taxAmount],
    ],
    total: quote.total,
  });

  const pageH = doc.internal.pageSize.getHeight();
  const maxW = W - M * 2;
  /** Adds a page when `ty` would collide with the footer, resetting it near the top. */
  const ensureRoom = (needed: number) => {
    if (ty + needed > pageH - 24) {
      doc.addPage();
      ty = 20;
    }
  };
  const sectionHeading = (label: string) => {
    ensureRoom(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label, M, ty);
    ty += 5;
  };

  if (quote.notes) {
    sectionHeading("NOTAS");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const noteLines = doc.splitTextToSize(quote.notes, maxW) as string[];
    for (const line of noteLines) {
      ensureRoom(5);
      doc.text(line, M, ty);
      ty += 4.6;
    }
    ty += 4;
  }

  sectionHeading("CONDICIONES");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  for (const legend of quoteTermsLines(quote.terms)) {
    const wrapped = doc.splitTextToSize(legend, maxW - 4) as string[];
    wrapped.forEach((line, i) => {
      ensureRoom(4.6);
      doc.text(i === 0 ? "•" : " ", M, ty);
      doc.text(line, M + 4, ty);
      ty += 4.2;
    });
  }

  drawFooter(doc, {
    W,
    M,
    note: quote.validUntil
      ? `Cotización válida hasta ${quote.validUntil}. Precios en MXN. No constituye un CFDI.`
      : "Precios en MXN. Documento informativo · no constituye un CFDI.",
  });

  doc.save(`${quote.number}.pdf`);
}
