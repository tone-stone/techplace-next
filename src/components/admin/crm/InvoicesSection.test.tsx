import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import InvoicesSection from "./InvoicesSection";
import type { CrmClient } from "@/lib/crm/clients";
import type { CrmInvoice } from "@/lib/crm/invoices";

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

const invoices: CrmInvoice[] = [
  {
    id: "i1",
    clientId: "c1",
    projectId: null,
    paymentId: null,
    number: "TP-2026-001",
    amount: 22500,
    status: "enviada",
    issuedDate: "2026-08-01",
    dueDate: "2026-08-15",
    notes: null,
    createdAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "i2",
    clientId: "c1",
    projectId: null,
    paymentId: null,
    number: "TP-2026-002",
    amount: 18000,
    status: "vencida",
    issuedDate: "2026-07-01",
    dueDate: "2026-07-15",
    notes: null,
    createdAt: "2026-07-01T00:00:00Z",
  },
];

describe("InvoicesSection", () => {
  it("lists invoices and resolves the client's company name", () => {
    render(<InvoicesSection invoices={invoices} clients={clients} projects={[]} />);
    expect(screen.getByText("TP-2026-001")).toBeInTheDocument();
    expect(screen.getAllByText("Acme Corp")).toHaveLength(2);
  });

  it("sums enviada + vencida invoices into the pending total", () => {
    render(<InvoicesSection invoices={invoices} clients={clients} projects={[]} />);
    expect(screen.getByText("$40,500")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no invoices", () => {
    render(<InvoicesSection invoices={[]} clients={clients} projects={[]} />);
    expect(screen.getByText(/no hay facturas/i)).toBeInTheDocument();
  });
});
