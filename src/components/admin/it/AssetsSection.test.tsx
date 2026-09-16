import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssetsSection from "./AssetsSection";
import type { ItAsset } from "@/lib/it/asset-types";

const clients = [
  { id: "c1", name: "Acme Corp" },
  { id: "c2", name: "Beta Studio" },
];

const asset = (over: Partial<ItAsset>): ItAsset => ({
  id: "a",
  clientId: "c1",
  name: "Activo",
  assetType: "otro",
  status: "activo",
  identifier: null,
  location: null,
  ipAddress: null,
  vendor: null,
  notes: null,
  acquiredOn: null,
  warrantyUntil: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

const assets: ItAsset[] = [
  asset({ id: "a1", clientId: "c1", name: "Server-01", assetType: "servidor", ipAddress: "10.0.0.1" }),
  asset({ id: "a2", clientId: "c1", name: "Firewall principal", assetType: "firewall", status: "en_reparacion" }),
  asset({ id: "a3", clientId: "c2", name: "Dominio beta.com", assetType: "dominio" }),
];

describe("AssetsSection", () => {
  it("lists every asset with its type and status", () => {
    render(<AssetsSection assets={assets} clients={clients} />);
    expect(screen.getByText("Server-01")).toBeInTheDocument();
    expect(screen.getByText("Firewall principal")).toBeInTheDocument();
    expect(screen.getByText("En reparación")).toBeInTheDocument();
  });

  it("filters by client", async () => {
    const user = userEvent.setup();
    render(<AssetsSection assets={assets} clients={clients} />);

    // First combobox in the filter bar is the client filter.
    const clientFilter = screen.getByDisplayValue("Todos los clientes");
    await user.selectOptions(clientFilter, "c2");

    expect(screen.getByText("Dominio beta.com")).toBeInTheDocument();
    expect(screen.queryByText("Server-01")).not.toBeInTheDocument();
  });

  it("filters by search text (name / IP / client)", async () => {
    const user = userEvent.setup();
    render(<AssetsSection assets={assets} clients={clients} />);

    await user.type(screen.getByPlaceholderText("Buscar activo…"), "10.0.0.1");
    expect(screen.getByText("Server-01")).toBeInTheDocument();
    expect(screen.queryByText("Firewall principal")).not.toBeInTheDocument();
  });

  it("opens an inline edit form pre-filled with the asset", async () => {
    const user = userEvent.setup();
    render(<AssetsSection assets={assets} clients={clients} />);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect(screen.getByDisplayValue("Server-01")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<AssetsSection assets={assets} clients={clients} />);

    await user.type(screen.getByPlaceholderText("Buscar activo…"), "no existe");
    expect(screen.getByText(/no hay activos que coincidan/i)).toBeInTheDocument();
  });
});
