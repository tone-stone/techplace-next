import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QuotesSection from "./QuotesSection";
import type { CrmClient } from "@/lib/crm/clients";
import type { CrmQuote } from "@/lib/crm/quotes";

const clients: CrmClient[] = [
  {
    id: "c1",
    name: "Ana Ruiz",
    company: "Acme Corp",
    email: "ana@acme.com",
    phone: "664 000 0001",
    status: "activo",
    service: "Desarrollo Web",
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const quotes: CrmQuote[] = [
  {
    id: "q1",
    number: "COT-2026-001",
    clientId: "c1",
    clientName: "Ana Ruiz",
    clientCompany: "Acme Corp",
    clientEmail: "ana@acme.com",
    status: "enviada",
    subtotal: 10000,
    taxRate: 16,
    taxAmount: 1600,
    total: 11600,
    notes: null,
    validUntil: "2026-12-31",
    createdAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "q2",
    number: "COT-2026-002",
    clientId: null,
    clientName: "Prospecto Sin CRM",
    clientCompany: null,
    clientEmail: null,
    status: "borrador",
    subtotal: 5000,
    taxRate: 0,
    taxAmount: 0,
    total: 5000,
    notes: null,
    validUntil: null,
    createdAt: "2026-08-05T00:00:00Z",
  },
];

describe("QuotesSection", () => {
  it("lists quotes for CRM clients", () => {
    render(<QuotesSection quotes={quotes} clients={clients} />);
    expect(screen.getByText("COT-2026-001")).toBeInTheDocument();
  });

  it("still renders a prospect quote's free-text client name with no linked client", () => {
    render(<QuotesSection quotes={quotes} clients={clients} />);
    expect(screen.getByText("Prospecto Sin CRM")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no quotes", () => {
    render(<QuotesSection quotes={[]} clients={clients} />);
    expect(screen.getByText(/no hay cotizaciones/i)).toBeInTheDocument();
  });
});
