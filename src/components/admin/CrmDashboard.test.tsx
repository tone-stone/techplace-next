import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CrmDashboard from "./CrmDashboard";

describe("CrmDashboard", () => {
  it("shows the Resumen (overview) section by default", () => {
    render(<CrmDashboard email="ana@techplacetj.com" clients={[]} payments={[]} />);
    expect(screen.getByText("Clientes activos")).toBeInTheDocument();
  });

  it("switches to Clientes when that nav item is clicked", async () => {
    const user = userEvent.setup();
    render(<CrmDashboard email="ana@techplacetj.com" clients={[]} payments={[]} />);

    await user.click(screen.getAllByRole("button", { name: "Clientes" })[0]);

    expect(screen.getByText(/clientes y leads/i)).toBeInTheDocument();
  });

  it("switches to Proyectos when that nav item is clicked", async () => {
    const user = userEvent.setup();
    render(<CrmDashboard email="ana@techplacetj.com" clients={[]} payments={[]} />);

    await user.click(screen.getAllByRole("button", { name: "Proyectos" })[0]);

    expect(screen.getByText(/^proyectos \(/i)).toBeInTheDocument();
  });

  it("switches to Facturación when that nav item is clicked", async () => {
    const user = userEvent.setup();
    render(<CrmDashboard email="ana@techplacetj.com" clients={[]} payments={[]} />);

    await user.click(screen.getAllByRole("button", { name: "Facturación" })[0]);

    expect(screen.getByText(/facturación y cotizaciones/i)).toBeInTheDocument();
  });

  it("shows the signed-in user's email in the sidebar", () => {
    render(<CrmDashboard email="ana@techplacetj.com" clients={[]} payments={[]} />);
    expect(screen.getByText("ana@techplacetj.com")).toBeInTheDocument();
  });
});
