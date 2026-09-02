import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("opens a detail modal from the folio, with view + edit", async () => {
    const user = userEvent.setup();
    render(<InvoicesSection invoices={invoices} clients={clients} projects={[]} />);

    expect(screen.getAllByRole("button", { name: /descargar pdf de/i }).length).toBe(invoices.length);

    await user.click(screen.getByRole("button", { name: "TP-2026-001" }));
    const dialog = screen.getByRole("dialog", { name: /factura TP-2026-001/i });
    expect(within(dialog).getByText("Acme Corp")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /editar/i }));
    expect(within(dialog).getByDisplayValue("22500")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });

  it("in read-only mode the modal has PDF but no edit/delete", async () => {
    const user = userEvent.setup();
    render(<InvoicesSection invoices={invoices} clients={clients} projects={[]} readOnly />);
    expect(screen.queryByRole("button", { name: /nueva factura/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "TP-2026-001" }));
    const dialog = screen.getByRole("dialog", { name: /factura TP-2026-001/i });
    expect(within(dialog).getByRole("button", { name: /descargar pdf/i })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^editar$/i })).not.toBeInTheDocument();
  });
});
