import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TasksSection from "./TasksSection";
import type { CrmProject } from "@/lib/crm/projects";
import type { CrmTask } from "@/lib/crm/tasks";

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
  {
    id: "p2",
    clientId: "c2",
    name: "App de rentas",
    description: null,
    status: "planeacion",
    progress: 0,
    budget: 20000,
    dueDate: null,
    createdAt: "2026-02-01T00:00:00Z",
  },
];

const task = (over: Partial<CrmTask>): CrmTask => ({
  id: "t",
  projectId: "p1",
  clientId: null,
  title: "Tarea",
  description: null,
  status: "por_hacer",
  assignee: null,
  assigneeId: null,
  dueDate: null,
  createdAt: "2026-01-02T00:00:00Z",
  ...over,
});

const tasks: CrmTask[] = [
  task({ id: "t1", projectId: "p1", title: "Wireframes", status: "por_hacer" }),
  task({ id: "t2", projectId: "p1", title: "Auditoría de accesibilidad", status: "en_progreso" }),
  task({ id: "t3", projectId: "p2", title: "Tarea de otro proyecto" }),
  task({ id: "t4", projectId: null, title: "Llamar al proveedor", clientId: "c1" }),
];

describe("TasksSection", () => {
  it("falls back to the 'Sueltas' view and still renders when there are no projects", () => {
    render(<TasksSection tasks={[task({ id: "t4", projectId: null, title: "Llamar al proveedor" })]} projects={[]} />);
    expect(screen.getByRole("button", { name: "Sueltas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Llamar al proveedor")).toBeInTheDocument();
  });

  it("places each task in the column matching its status, for the selected project", () => {
    render(<TasksSection tasks={tasks} projects={projects} />);
    expect(screen.getByText("Wireframes")).toBeInTheDocument();
    expect(screen.getByText("Auditoría de accesibilidad")).toBeInTheDocument();
    expect(screen.queryByText("Tarea de otro proyecto")).not.toBeInTheDocument();
    // A standalone task must not leak into a project board.
    expect(screen.queryByText("Llamar al proveedor")).not.toBeInTheDocument();
  });

  it("switches the visible tasks when a different project is selected", async () => {
    const user = userEvent.setup();
    render(<TasksSection tasks={tasks} projects={projects} />);

    await user.selectOptions(screen.getByDisplayValue("Rediseño institucional"), "p2");

    expect(screen.getByText("Tarea de otro proyecto")).toBeInTheDocument();
    expect(screen.queryByText("Wireframes")).not.toBeInTheDocument();
  });

  it("shows only project-less tasks in the 'Sueltas' view", async () => {
    const user = userEvent.setup();
    render(<TasksSection tasks={tasks} projects={projects} />);

    await user.click(screen.getByRole("button", { name: "Sueltas" }));

    expect(screen.getByText("Llamar al proveedor")).toBeInTheDocument();
    expect(screen.queryByText("Wireframes")).not.toBeInTheDocument();
  });

  it("offers 'Sin proyecto' and a client picker in the new-task form", async () => {
    const user = userEvent.setup();
    render(
      <TasksSection
        tasks={tasks}
        projects={projects}
        clientOptions={[{ id: "c1", name: "Acme Corp" }]}
      />
    );

    await user.click(screen.getByRole("button", { name: /nueva tarea/i }));

    expect(screen.getByRole("option", { name: "— Sin proyecto —" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Acme Corp" })).toBeInTheDocument();
  });
});
