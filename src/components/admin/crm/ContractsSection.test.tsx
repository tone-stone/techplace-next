import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContractsSection from "./ContractsSection";
import type { CrmContract } from "@/lib/crm/contracts";
import type { CrmService } from "@/lib/crm/contract-types";

const clients = [
  { id: "c1", name: "Acme Corp" },
  { id: "c2", name: "Beta Studio" },
];

const services: CrmService[] = [
  { id: "s1", name: "Soporte por hora", description: null, unit: "hora", defaultRate: 500, active: true, createdAt: "2026-01-01T00:00:00Z" },
  { id: "s2", name: "Retainer mensual", description: "Bolsa de horas", unit: "mes", defaultRate: 8000, active: true, createdAt: "2026-01-02T00:00:00Z" },
];

const contract = (over: Partial<CrmContract>): CrmContract => ({
  id: "k",
  clientId: "c1",
  title: "Contrato",
  status: "activo",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  includedHours: 20,
  slaHours: 4,
  billingAmount: 8000,
  billingCycle: "mensual",
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

const contracts: CrmContract[] = [
  contract({ id: "k1", title: "Soporte IT 2026", clientId: "c1", includedHours: 20 }),
  contract({ id: "k2", title: "Mantenimiento web", clientId: "c2", status: "borrador", includedHours: 8 }),
];

describe("ContractsSection", () => {
  it("lists contracts with client, status and included hours", () => {
    render(<ContractsSection contracts={contracts} services={services} clients={clients} />);
    expect(screen.getByText("Soporte IT 2026")).toBeInTheDocument();
    // "Acme Corp" also appears in the client filter <select>, so match ≥1.
    expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
    expect(screen.getByText("20 h incluidas")).toBeInTheDocument();
  });

  it("filters contracts by client", async () => {
    const user = userEvent.setup();
    render(<ContractsSection contracts={contracts} services={services} clients={clients} />);

    await user.selectOptions(screen.getByDisplayValue("Todos los clientes"), "c2");
    expect(screen.getByText("Mantenimiento web")).toBeInTheDocument();
    expect(screen.queryByText("Soporte IT 2026")).not.toBeInTheDocument();
  });

  it("switches to the service catalog view", async () => {
    const user = userEvent.setup();
    render(<ContractsSection contracts={contracts} services={services} clients={clients} />);

    await user.click(screen.getByRole("button", { name: "Catálogo" }));
    expect(screen.getByText("Soporte por hora")).toBeInTheDocument();
    expect(screen.getByText("Retainer mensual")).toBeInTheDocument();
  });

  it("opens the new-service form with a 'tipo de servicio' picker for the catalog", async () => {
    const user = userEvent.setup();
    render(<ContractsSection contracts={contracts} services={services} clients={clients} />);

    await user.click(screen.getByRole("button", { name: /nuevo servicio/i }));
    expect(screen.getByPlaceholderText("Título (Soporte IT 2026)")).toBeInTheDocument();
    const typeSelect = screen.getByRole("combobox", { name: /tipo de servicio/i });
    expect(typeSelect).toHaveValue("mes");
    expect(within(typeSelect).getByRole("option", { name: "Por proyecto" })).toBeInTheDocument();
  });

  it("lets a catalog service be contracted to an existing or new client", async () => {
    const user = userEvent.setup();
    render(<ContractsSection contracts={contracts} services={services} clients={clients} />);

    await user.click(screen.getByRole("button", { name: /catálogo/i }));
    await user.click(screen.getAllByRole("button", { name: /añadir a cliente/i })[0]);

    const clientSelect = screen.getAllByRole("combobox")[0];
    expect(within(clientSelect).getByRole("option", { name: "Acme Corp" })).toBeInTheDocument();
    expect(within(clientSelect).getByRole("option", { name: "+ Cliente nuevo…" })).toBeInTheDocument();

    // Picking "nuevo" reveals the new-client fields.
    await user.selectOptions(clientSelect, "__new__");
    expect(screen.getByPlaceholderText(/empresa \/ nombre del cliente/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contratar" })).toBeInTheDocument();
  });

  it("asks for confirmation before contracting a service to a client", async () => {
    const user = userEvent.setup();
    render(<ContractsSection contracts={contracts} services={services} clients={clients} />);

    await user.click(screen.getByRole("button", { name: /catálogo/i }));
    await user.click(screen.getAllByRole("button", { name: /añadir a cliente/i })[0]);
    // Default target is the first client (Acme Corp) — no new-client fields needed.
    await user.click(screen.getByRole("button", { name: "Contratar" }));

    expect(screen.getByRole("dialog", { name: /añadir servicio al cliente/i })).toBeInTheDocument();
    expect(screen.getByText(/se contratará .*para acme corp/i)).toBeInTheDocument();
  });
});
