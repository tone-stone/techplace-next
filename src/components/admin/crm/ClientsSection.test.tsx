import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientsSection from "./ClientsSection";
import type { CrmClient } from "@/lib/crm/clients";

const clients: CrmClient[] = [
  {
    id: "1",
    name: "Ana Ruiz",
    company: "Acme Corp",
    email: "ana@acme.com",
    phone: "664 000 0001",
    status: "activo",
    service: "Desarrollo Web",
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Beto Solis",
    company: "Beta Studio",
    email: "beto@beta.com",
    phone: "664 000 0002",
    status: "lead",
    service: "Consultoría IT",
    notes: null,
    createdAt: "2026-02-01T00:00:00Z",
  },
];

describe("ClientsSection", () => {
  it("lists every client under 'Todos'", () => {
    render(<ClientsSection clients={clients} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Studio")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    render(<ClientsSection clients={clients} />);

    await user.click(screen.getByRole("button", { name: "Leads" }));

    expect(screen.getByText("Beta Studio")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
  });

  it("filters by search text across name and company", async () => {
    const user = userEvent.setup();
    render(<ClientsSection clients={clients} />);

    await user.type(screen.getByPlaceholderText("Buscar cliente…"), "acme");

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Studio")).not.toBeInTheDocument();
  });

  it("filters by search text across email and phone", async () => {
    const user = userEvent.setup();
    render(<ClientsSection clients={clients} />);

    const search = screen.getByPlaceholderText("Buscar cliente…");

    await user.type(search, "beto@beta.com");
    expect(screen.getByText("Beta Studio")).toBeInTheDocument();
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "0001");
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.queryByText("Beta Studio")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when filter + search match nothing", async () => {
    const user = userEvent.setup();
    render(<ClientsSection clients={clients} />);

    await user.type(screen.getByPlaceholderText("Buscar cliente…"), "no existe esta empresa");

    expect(screen.getByText(/no hay clientes/i)).toBeInTheDocument();
  });

  it("summarizes each client's plan, open work and stale quotes on the card", () => {
    const old = "2026-01-01T00:00:00Z"; // well over 14 days before any plausible test run
    render(
      <ClientsSection
        clients={clients}
        plans={[
          {
            id: "p1",
            clientId: "1",
            company: "Acme Corp",
            name: "Soporte mensual",
            amount: 2500,
            billingCycle: "mensual",
            cutoffDay: 1,
            nextDueDate: "2030-01-01",
            status: "activo",
            contractId: null,
          },
        ]}
        projects={[
          { id: "pr1", clientId: "1", name: "Rediseño", status: "en_progreso" },
        ] as never}
        tasks={[{ id: "t1", clientId: "1", title: "Llamar", status: "por_hacer" }] as never}
        quotes={
          [
            { id: "q1", clientId: "1", number: "C-1", status: "enviada", validUntil: null, createdAt: old },
          ] as never
        }
      />
    );

    expect(screen.getByText(/Plan: Soporte mensual/)).toBeInTheDocument();
    expect(screen.getByText(/1 proyecto/)).toBeInTheDocument();
    expect(screen.getByText(/1 tarea/)).toBeInTheDocument();
    expect(screen.getByText(/1 cotización sin seguimiento/)).toBeInTheDocument();
  });
});
