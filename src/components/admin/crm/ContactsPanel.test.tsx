import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactsPanel from "./ContactsPanel";
import type { CrmContact } from "@/lib/crm/contacts";

const contacts: CrmContact[] = [
  {
    id: "k1",
    clientId: "c1",
    name: "Ana Ruiz",
    email: "ana@acme.com",
    phone: "664 000 0001",
    role: "Gerente IT",
    isPrimary: true,
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "k2",
    clientId: "c1",
    name: "Beto Solis",
    email: null,
    phone: "664 000 0002",
    role: "Administración",
    isPrimary: false,
    notes: null,
    createdAt: "2026-02-01T00:00:00Z",
  },
];

describe("ContactsPanel", () => {
  it("lists every contact with its role", () => {
    render(<ContactsPanel clientId="c1" contacts={contacts} onChanged={() => {}} />);
    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
    expect(screen.getByText("Beto Solis")).toBeInTheDocument();
    expect(screen.getByText("· Gerente IT")).toBeInTheDocument();
  });

  it("marks the primary contact and offers 'Hacer principal' only on the others", () => {
    render(<ContactsPanel clientId="c1" contacts={contacts} onChanged={() => {}} />);
    expect(screen.getByText("Principal")).toBeInTheDocument();
    // One non-primary contact -> exactly one "Hacer principal" button.
    expect(screen.getAllByRole("button", { name: "Hacer principal" })).toHaveLength(1);
  });

  it("toggles the 'Nuevo contacto' form", async () => {
    const user = userEvent.setup();
    render(<ContactsPanel clientId="c1" contacts={contacts} onChanged={() => {}} />);

    expect(screen.queryByPlaceholderText("Nombre")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /nuevo contacto/i }));
    expect(screen.getByPlaceholderText("Nombre")).toBeInTheDocument();
  });

  it("shows an empty state when the client has no contacts", () => {
    render(<ContactsPanel clientId="c1" contacts={[]} onChanged={() => {}} />);
    expect(screen.getByText(/no tiene contactos registrados/i)).toBeInTheDocument();
  });

  it("opens an inline edit form pre-filled with the contact's data", async () => {
    const user = userEvent.setup();
    render(<ContactsPanel clientId="c1" contacts={contacts} onChanged={() => {}} />);

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect(screen.getByDisplayValue("Ana Ruiz")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gerente IT")).toBeInTheDocument();
  });
});
