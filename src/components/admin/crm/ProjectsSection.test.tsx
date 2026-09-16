import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsSection from "./ProjectsSection";
import type { CrmClient } from "@/lib/crm/clients";
import type { CrmProject } from "@/lib/crm/projects";

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

const projects: CrmProject[] = [
  {
    id: "p1",
    clientId: "c1",
    name: "Rediseño institucional",
    description: null,
    status: "en_progreso",
    progress: 65,
    budget: 45000,
    dueDate: "2026-09-30",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("ProjectsSection", () => {
  it("lists projects and resolves the client's company name", () => {
    render(<ProjectsSection projects={projects} clients={clients} />);
    expect(screen.getByText("Rediseño institucional")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no projects", () => {
    render(<ProjectsSection projects={[]} clients={clients} />);
    expect(screen.getByText(/no hay proyectos/i)).toBeInTheDocument();
  });

  it("toggles the new-project form open and closed", async () => {
    const user = userEvent.setup();
    render(<ProjectsSection projects={projects} clients={clients} />);

    await user.click(screen.getByRole("button", { name: /nuevo proyecto/i }));
    expect(screen.getByPlaceholderText("Nombre del proyecto")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByPlaceholderText("Nombre del proyecto")).not.toBeInTheDocument();
  });
});
