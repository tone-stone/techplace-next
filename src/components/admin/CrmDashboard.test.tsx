import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CrmDashboard from "./CrmDashboard";
import type { Role } from "@/lib/auth/roles";

function renderDash(role: Role = "admin") {
  return render(
    <CrmDashboard
      email="ana@techplacetj.com"
      role={role}
      clients={[]}
      payments={[]}
      projects={[]}
      invoices={[]}
      quotes={[]}
      tasks={[]}
    />
  );
}

describe("CrmDashboard", () => {
  it("shows the Resumen (overview) section by default for admin", () => {
    renderDash("admin");
    expect(screen.getByText("Clientes activos")).toBeInTheDocument();
  });

  it("switches to Clientes when that nav item is clicked", async () => {
    const user = userEvent.setup();
    renderDash("admin");
    await user.click(screen.getAllByRole("button", { name: "Clientes" })[0]);
    expect(screen.getByText(/clientes y leads/i)).toBeInTheDocument();
  });

  it("switches to Proyectos when that nav item is clicked", async () => {
    const user = userEvent.setup();
    renderDash("admin");
    await user.click(screen.getAllByRole("button", { name: "Proyectos" })[0]);
    expect(screen.getByText(/^proyectos \(/i)).toBeInTheDocument();
  });

  it("switches to Facturación when that nav item is clicked", async () => {
    const user = userEvent.setup();
    renderDash("admin");
    await user.click(screen.getAllByRole("button", { name: "Facturación" })[0]);
    expect(screen.getByText(/^facturación \(/i)).toBeInTheDocument();
  });

  it("switches to Cotizaciones when that nav item is clicked", async () => {
    const user = userEvent.setup();
    renderDash("admin");
    await user.click(screen.getAllByRole("button", { name: "Cotizaciones" })[0]);
    expect(screen.getByText(/^cotizaciones \(/i)).toBeInTheDocument();
  });

  it("switches to Tareas when that nav item is clicked", async () => {
    const user = userEvent.setup();
    renderDash("admin");
    await user.click(screen.getAllByRole("button", { name: "Tareas" })[0]);
    expect(screen.getByText(/crea un proyecto primero/i)).toBeInTheDocument();
  });

  it("hides Monitoreo, Usuarios and Blog for an ejecutivo", () => {
    renderDash("ejecutivo");
    expect(screen.queryAllByRole("button", { name: "Usuarios" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "Monitoreo" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "Blog" })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: "Clientes" }).length).toBeGreaterThan(0);
  });

  it("shows only Blog and Tareas for a redactor", () => {
    renderDash("redactor");
    expect(screen.getAllByRole("button", { name: "Blog" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Tareas" }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole("button", { name: "Clientes" })).toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: "Usuarios" })).toHaveLength(0);
  });

  it("switches to Usuarios when that nav item is clicked (admin)", async () => {
    const user = userEvent.setup();
    renderDash("admin");
    await user.click(screen.getAllByRole("button", { name: "Usuarios" })[0]);
    expect(screen.getByText("Usuarios totales")).toBeInTheDocument();
  });

  it("shows the signed-in user's email in the sidebar", () => {
    renderDash("admin");
    expect(screen.getByText("ana@techplacetj.com")).toBeInTheDocument();
  });
});
