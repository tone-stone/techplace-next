import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketsSection from "./TicketsSection";
import type { ItTicket } from "@/lib/it/ticket-types";

const clients = [
  { id: "c1", name: "Acme Corp" },
  { id: "c2", name: "Beta Studio" },
];

const assignees = [
  { id: "u1", name: "Ana" },
  { id: "u2", name: "Beto" },
] as never[];

const ticket = (over: Partial<ItTicket>): ItTicket => ({
  id: "t",
  number: "TK-2026-001",
  clientId: "c1",
  contactId: null,
  assetId: null,
  assigneeId: null,
  subject: "Ticket",
  description: null,
  status: "abierto",
  priority: "media",
  category: null,
  slaDueAt: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: "2026-08-01T00:00:00Z",
  ...over,
});

const tickets: ItTicket[] = [
  ticket({ id: "t1", number: "TK-2026-001", subject: "VPN caída", status: "abierto", assigneeId: "u1" }),
  ticket({ id: "t2", number: "TK-2026-002", subject: "Correo lento", status: "en_progreso", assigneeId: "u2" }),
  ticket({ id: "t3", number: "TK-2026-003", subject: "Impresora vieja", status: "cerrado", clientId: "c2" }),
];

describe("TicketsSection", () => {
  it("defaults to 'Abiertos' and hides resolved/closed tickets", () => {
    render(<TicketsSection tickets={tickets} clients={clients} assignees={assignees} currentUserId="u1" />);
    expect(screen.getByText("VPN caída")).toBeInTheDocument();
    expect(screen.getByText("Correo lento")).toBeInTheDocument();
    expect(screen.queryByText("Impresora vieja")).not.toBeInTheDocument();
  });

  it("filters to the signed-in user's tickets with 'Míos'", async () => {
    const user = userEvent.setup();
    render(<TicketsSection tickets={tickets} clients={clients} assignees={assignees} currentUserId="u1" />);

    await user.click(screen.getByRole("button", { name: "Míos" }));

    expect(screen.getByText("VPN caída")).toBeInTheDocument();
    expect(screen.queryByText("Correo lento")).not.toBeInTheDocument();
  });

  it("searches by subject or ticket number", async () => {
    const user = userEvent.setup();
    render(<TicketsSection tickets={tickets} clients={clients} assignees={assignees} currentUserId="u1" />);

    await user.type(screen.getByPlaceholderText("Buscar ticket…"), "TK-2026-002");
    expect(screen.getByText("Correo lento")).toBeInTheDocument();
    expect(screen.queryByText("VPN caída")).not.toBeInTheDocument();
  });

  it("can show every status including closed via 'Todos'", async () => {
    const user = userEvent.setup();
    render(<TicketsSection tickets={tickets} clients={clients} assignees={assignees} currentUserId="u1" />);

    await user.selectOptions(screen.getByDisplayValue("Abiertos"), "todos");
    expect(screen.getByText("Impresora vieja")).toBeInTheDocument();
  });

  it("opens the new-ticket form", async () => {
    const user = userEvent.setup();
    render(<TicketsSection tickets={tickets} clients={clients} assignees={assignees} currentUserId="u1" />);

    await user.click(screen.getByRole("button", { name: /nuevo ticket/i }));
    expect(screen.getByPlaceholderText("Asunto")).toBeInTheDocument();
  });
});
