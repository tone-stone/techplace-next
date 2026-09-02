import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QuotePreview, { type QuotePreviewData } from "./QuotePreview";

const base: QuotePreviewData = {
  number: "COT-2026-007",
  status: "borrador",
  clientName: "Ana Ruiz",
  clientCompany: "Acme Corp",
  clientEmail: "ana@acme.com",
  issuedDate: "2026-09-01",
  validUntil: "2026-10-01",
  items: [
    { concept: "Sitio web", quantity: 1, unitPrice: 10000 },
    { concept: "", quantity: 1, unitPrice: 999 }, // pristine row, ignored
  ],
  taxRate: 16,
  notes: "Incluye 2 rondas de ajustes.",
  terms: null,
};

describe("QuotePreview", () => {
  it("renders the folio, client, a real line item and the computed total", () => {
    render(<QuotePreview data={base} />);
    expect(screen.getByText("COT-2026-007")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Sitio web")).toBeInTheDocument();
    // 10,000 + 16% IVA = 11,600
    expect(screen.getByText(/\$11,600/)).toBeInTheDocument();
    expect(screen.queryByText("$999.00")).not.toBeInTheDocument();
  });

  it("shows the default executive legends when terms is null", () => {
    render(<QuotePreview data={base} />);
    expect(screen.getByText(/sujeta a cambios sin previo aviso/i)).toBeInTheDocument();
    expect(screen.getByText(/no constituye un comprobante fiscal/i)).toBeInTheDocument();
  });

  it("shows a custom terms blob when provided", () => {
    render(<QuotePreview data={{ ...base, terms: "Condición especial única" }} />);
    expect(screen.getByText("Condición especial única")).toBeInTheDocument();
    expect(screen.queryByText(/sujeta a cambios sin previo aviso/i)).not.toBeInTheDocument();
  });
});
