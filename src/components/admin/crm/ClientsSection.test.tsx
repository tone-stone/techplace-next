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

  it("shows an empty-state message when filter + search match nothing", async () => {
    const user = userEvent.setup();
    render(<ClientsSection clients={clients} />);

    await user.type(screen.getByPlaceholderText("Buscar cliente…"), "no existe esta empresa");

    expect(screen.getByText(/no hay clientes/i)).toBeInTheDocument();
  });
});
