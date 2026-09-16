import type { jsPDF } from "jspdf";
import { formatCurrencyMXN } from "./format";

/**
 * Shared look for the client-facing PDFs (recibo de cobro + cotización): brand
 * colors, the logo loader, and the header / totals / footer drawers so both
 * documents render as the same template. All of this runs client-side only
 * (jsPDF is dynamically imported from a click handler).
 */

export const ACCENT: [number, number, number] = [2, 132, 199]; // sky-600
export const INK: [number, number, number] = [30, 41, 59]; // slate-800
export const MUTED: [number, number, number] = [120, 128, 140];

export type BrandLogo = { dataUrl: string; w: number; h: number };

let logoCache: Promise<BrandLogo | null> | null = null;

/**
 * Fetches the wordmark and converts it to a PNG data URL (jsPDF can't embed
 * WebP). Cached for the session; returns `null` on any failure so the PDF
 * still generates with the text fallback.
 */
export function loadBrandLogo(): Promise<BrandLogo | null> {
  if (logoCache) return logoCache;
  logoCache = (async () => {
    try {
      const res = await fetch("/img/logos/techplace-wordmark.webp");
      if (!res.ok) return null;
      const bmp = await createImageBitmap(await res.blob());
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bmp, 0, 0);
      return { dataUrl: canvas.toDataURL("image/png"), w: bmp.width, h: bmp.height };
    } catch {
      return null;
    }
  })();
  return logoCache;
}

/**
 * Draws the accent bar, logo (or "TechPlace" fallback) + issuer line, and a
 * bordered meta box on the right. Returns the Y where body content should start.
 */
export function drawHeader(
  doc: jsPDF,
  opts: {
    W: number;
    M: number;
    logo: BrandLogo | null;
    title: string;
    metaRows: [string, string][];
  }
): number {
  const { W, M, logo, title, metaRows } = opts;

  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 6, "F");

  let leftBottom: number;
  if (logo) {
    const logoW = 42;
    const logoH = (logo.h / logo.w) * logoW;
    doc.addImage(logo.dataUrl, "PNG", M, 14, logoW, logoH);
    leftBottom = 14 + logoH;
  } else {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("TechPlace", M, 24);
    leftBottom = 26;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("Soluciones digitales · techplace.mx · hola@techplace.mx", M, leftBottom + 5);

  const boxW = 66;
  const boxX = W - M - boxW;
  const boxY = 14;
  const boxH = 12 + metaRows.length * 5;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...ACCENT);
  doc.text(title, boxX + boxW / 2, boxY + 7, { align: "center" });

  doc.setFontSize(8.5);
  let my = boxY + 13;
  for (const [k, v] of metaRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(k, boxX + 4, my);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(v, boxX + boxW - 4, my, { align: "right" });
    my += 5;
  }

  const dividerY = Math.max(leftBottom + 12, boxY + boxH + 6);
  doc.setDrawColor(225);
  doc.setLineWidth(0.3);
  doc.line(M, dividerY, W - M, dividerY);
  return dividerY + 8;
}

/** A "CLIENTE" block: label, company (bold), and an optional second line. Returns next Y. */
export function drawClientBlock(
  doc: jsPDF,
  opts: { M: number; y: number; company: string; sub?: string | null }
): number {
  const { M, company, sub } = opts;
  let y = opts.y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("CLIENTE", M, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(company, M, y);
  if (sub) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(sub, M, y);
  }
  return y + 6;
}

/**
 * Right-aligned totals: any number of plain rows, then TOTAL in a filled
 * accent bar. Returns the Y below the block.
 */
export function drawTotals(
  doc: jsPDF,
  opts: { W: number; M: number; y: number; rows: [string, number][]; total: number }
): number {
  const { W, M, rows, total } = opts;
  let y = opts.y;
  const totX = W - M - 70;

  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(label, totX, y);
    doc.setTextColor(...INK);
    doc.text(formatCurrencyMXN(value), W - M, y, { align: "right" });
    y += 6;
  }

  doc.setFillColor(...ACCENT);
  doc.roundedRect(totX - 4, y - 5, W - M - totX + 4, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", totX, y + 1.5);
  doc.text(formatCurrencyMXN(total), W - M, y + 1.5, { align: "right" });
  return y + 14;
}

/** Footer rule + the fine print, pinned to the bottom of the page. */
export function drawFooter(doc: jsPDF, opts: { W: number; M: number; note: string }): void {
  const { W, M, note } = opts;
  const fy = doc.internal.pageSize.getHeight() - 18;
  doc.setDrawColor(225);
  doc.setLineWidth(0.3);
  doc.line(M, fy - 6, W - M, fy - 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(note, M, fy, { maxWidth: W - M * 2 });
  doc.text(`TechPlace · generado el ${new Date().toISOString().slice(0, 10)}`, M, fy + 4);
}
