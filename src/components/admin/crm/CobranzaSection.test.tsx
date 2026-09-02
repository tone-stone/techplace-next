import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CobranzaSection from "./CobranzaSection";
import type { CollectionItem, ScheduledCharge } from "@/lib/crm/collections";
import type { CrmInvoice } from "@/lib/crm/invoices";

/** A date string N days from today (local), YYYY-MM-DD. */
function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const item = (over: Partial<CollectionItem>): CollectionItem => ({
  paymentId: "pay",
  clientId: "cli",
  company: "Empresa",
  contactName: null,
  planName: "Soporte mensual",
  amount: 5000,
  dueDate: isoInDays(3),
  method: null,
  daysLeft: 3,
  status: "pendiente",
  ...over,
});

const collections: CollectionItem[] = [
  item({ paymentId: "p-soon", company: "Acme", amount: 5000, dueDate: isoInDays(3), daysLeft: 3, status: "pendiente" }),
  item({ paymentId: "p-late", company: "Beta", amount: 8000, dueDate: isoInDays(-10), daysLeft: -10, status: "vencido" }),
];

const scheduled: ScheduledCharge[] = [
  {
    planId: "plan-1",
    clientId: "cli-1",
    company: "Acme",
    contactName: null,
    planName: "Soporte mensual",
    amount: 4200,
    billingCycle: "mensual",
    nextDueDate: isoInDays(45), // beyond this month + this week → lands in "Próximos"
    daysLeft: 45,
  },
];

describe("CobranzaSection", () => {
  it("opens on 'Próximos' and merges generated + scheduled cobros", () => {
    render(<CobranzaSection collections={collections} scheduledCharges={scheduled} />);
    expect(screen.getByRole("button", { name: "Próximos" })).toHaveAttribute("aria-pressed", "true");
    // 2 cobros reales + 1 proyección del plan
    expect(screen.getByText(/3 cobro\(s\)/)).toBeInTheDocument();
    expect(screen.getByText("programado")).toBeInTheDocument();
  });

  it("shows overdue items under 'Vencidos' with the total", async () => {
    const user = userEvent.setup();
    render(<CobranzaSection collections={collections} />);

    await user.click(screen.getByRole("button", { name: "Vencidos" }));

    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    // $8,000 shows both on the row and in the view total.
    expect(screen.getAllByText(/\$8,000/).length).toBeGreaterThan(0);
  });

  it("renders an empty state when a view has nothing", async () => {
    const user = userEvent.setup();
    render(<CobranzaSection collections={[collections[0]]} />);

    await user.click(screen.getByRole("button", { name: "Vencidos" }));
    expect(screen.getByText(/nada que cobrar/i)).toBeInTheDocument();
  });

  it("shows a plan charge due this month under 'Este mes', not only 'Próximos'", async () => {
    const user = userEvent.setup();
    const now = new Date();
    const mid = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
    const thisMonthCharge: ScheduledCharge = {
      planId: "plan-jissel",
      clientId: "cli-jissel",
      company: "Jissel",
      contactName: null,
      planName: "Mantenimiento mensual",
      amount: 1800,
      billingCycle: "mensual",
      nextDueDate: mid,
      daysLeft: 15 - now.getDate(),
    };
    render(<CobranzaSection collections={[]} scheduledCharges={[thisMonthCharge]} />);

    await user.click(screen.getByRole("button", { name: "Este mes" }));
    expect(screen.getByText("Jissel")).toBeInTheDocument();
    expect(screen.getByText(/Mantenimiento mensual/)).toBeInTheDocument();
  });

  it("toggles the 'Nuevo cobro' form and lists the passed clients", async () => {
    const user = userEvent.setup();
    render(
      <CobranzaSection
        collections={collections}
        clients={[{ id: "cli-1", name: "Tijuana Innovadora" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Nuevo cobro" }));
    expect(screen.getByRole("button", { name: "Guardar cobro" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Tijuana Innovadora" })).toBeInTheDocument();
  });

  it("offers 'Generar factura' per cobro, and the folio + PDF once it exists", async () => {
    const user = userEvent.setup();
    const invoices: CrmInvoice[] = [
      {
        id: "inv-1",
        clientId: "cli",
        projectId: null,
        paymentId: "p-soon",
        number: "TP-0007",
        amount: 5000,
        status: "enviada",
        issuedDate: isoInDays(0),
        dueDate: isoInDays(3),
        notes: null,
        createdAt: "2026-09-01T00:00:00Z",
      },
    ];
    render(<CobranzaSection collections={collections} invoices={invoices} />);
    await user.click(screen.getByRole("button", { name: "Esta semana" }));

    // p-soon (Acme) already has an invoice → folio + PDF button.
    expect(screen.getByRole("button", { name: /TP-0007 · PDF/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vencidos" }));
    // p-late (Beta) has none → offer to generate.
    expect(screen.getByRole("button", { name: /generar factura/i })).toBeInTheDocument();
  });

  it("opens an inline edit form for a charge and a confirm dialog to delete it", async () => {
    const user = userEvent.setup();
    render(<CobranzaSection collections={collections} />);

    await user.click(screen.getByRole("button", { name: "Esta semana" }));
    await user.click(screen.getByRole("button", { name: /Editar cobro de Acme/ }));
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: /Eliminar cobro de Acme/ }));
    expect(screen.getByText(/Se eliminará el cobro/)).toBeInTheDocument();
  });

  it("lists the upcoming recurring charges under 'Próximos'", () => {
    const scheduledCharges: ScheduledCharge[] = [
      {
        planId: "plan-1",
        clientId: "cli-1",
        company: "Tijuana Innovadora",
        contactName: null,
        planName: "Plan de soporte web",
        amount: 3500,
        billingCycle: "mensual",
        nextDueDate: isoInDays(12),
        daysLeft: 12,
      },
    ];
    render(<CobranzaSection collections={[]} scheduledCharges={scheduledCharges} />);

    expect(screen.getByRole("button", { name: "Próximos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Tijuana Innovadora")).toBeInTheDocument();
    expect(screen.getByText(/Plan de soporte web/)).toBeInTheDocument();
    expect(screen.getByText("programado")).toBeInTheDocument();
  });
});
