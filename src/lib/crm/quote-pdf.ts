import type { QuoteDetail } from "./quotes";
import { formatCurrencyMXN } from "./format";

/**
 * Client-side quote-to-PDF export, used by the "Descargar PDF" button in
 * `QuoteDetailModal`. Renders the TechPlace header, client info, line-item
 * table, and totals into a jsPDF document and triggers a browser download.
 */

// Only ever call this from a client-side event handler (a "use client"
// component's onClick). jsPDF/jspdf-autotable are dynamically imported here,
// inside the function body, so the browser only loads them after a real user
// click — this keeps them out of every server/RSC bundle by construction,
// no next/dynamic needed.
export async function downloadQuotePdf(detail: QuoteDetail): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const { quote, items } = detail;

  doc.setFontSize(16);
  doc.text("TechPlace", 14, 18);
  doc.setFontSize(10);
  doc.text(`Cotización ${quote.number}`, 14, 26);
  doc.text(
    `Cliente: ${quote.clientName}${quote.clientCompany ? ` (${quote.clientCompany})` : ""}`,
    14,
    32
  );
  if (quote.clientEmail) doc.text(`Email: ${quote.clientEmail}`, 14, 38);
  if (quote.validUntil) doc.text(`Vigente hasta: ${quote.validUntil}`, 14, 44);

  autoTable(doc, {
    startY: 50,
    head: [["Concepto", "Cantidad", "Precio unitario", "Importe"]],
    body: items.map((item) => [
      item.concept,
      String(item.quantity),
      formatCurrencyMXN(item.unitPrice),
      formatCurrencyMXN(item.quantity * item.unitPrice),
    ]),
    foot: [
      ["", "", "Subtotal", formatCurrencyMXN(quote.subtotal)],
      ["", "", `IVA (${quote.taxRate}%)`, formatCurrencyMXN(quote.taxAmount)],
      ["", "", "Total", formatCurrencyMXN(quote.total)],
    ],
  });

  if (quote.notes) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(9);
    doc.text(`Notas: ${quote.notes}`, 14, finalY + 10);
  }

  doc.save(`${quote.number}.pdf`);
}
