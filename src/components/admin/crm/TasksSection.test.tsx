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

const tasks: CrmTask[] = [
  {
    id: "t1",
    projectId: "p1",
    title: "Wireframes",
    description: null,
    status: "por_hacer",
    assignee: null,
    dueDate: null,
    createdAt: "2026-01-02T00:00:00Z",
  },
  {
    id: "t2",
    projectId: "p1",
    title: "Auditoría de accesibilidad",
    description: null,
    status: "en_progreso",
    assignee: null,
    dueDate: null,
    createdAt: "2026-01-03T00:00:00Z",
  },
  {
    id: "t3",
    projectId: "p2",
    title: "Tarea de otro proyecto",
    description: null,
    status: "por_hacer",
    assignee: null,
    dueDate: null,
    createdAt: "2026-02-02T00:00:00Z",
  },
];

describe("TasksSection", () => {
  it("shows an empty-state message when there are no projects", () => {
    render(<TasksSection tasks={[]} projects={[]} />);
    expect(screen.getByText(/crea un proyecto primero/i)).toBeInTheDocument();
  });

  it("places each task in the column matching its status, for the selected project", () => {
    render(<TasksSection tasks={tasks} projects={projects} />);
    expect(screen.getByText("Wireframes")).toBeInTheDocument();
    expect(screen.getByText("Auditoría de accesibilidad")).toBeInTheDocument();
    expect(screen.queryByText("Tarea de otro proyecto")).not.toBeInTheDocument();
  });

  it("switches the visible tasks when a different project is selected", async () => {
    const user = userEvent.setup();
    render(<TasksSection tasks={tasks} projects={projects} />);

    await user.selectOptions(screen.getByDisplayValue("Rediseño institucional"), "p2");

    expect(screen.getByText("Tarea de otro proyecto")).toBeInTheDocument();
    expect(screen.queryByText("Wireframes")).not.toBeInTheDocument();
  });
});
