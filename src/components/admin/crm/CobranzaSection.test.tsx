import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CobranzaSection from "./CobranzaSection";
import type { CollectionItem } from "@/lib/crm/collections";

/** A date string N days from today (local), YYYY-MM-DD. */
function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const item = (over: Partial<CollectionItem>): CollectionItem => ({
  paymentId: "pay",
  clientId: "cli",
  company: "Empresa",
  contactName: null,
  planName: "Soporte mensual",
  amount: 5000,
  dueDate: isoInDays(3),
  daysLeft: 3,
  status: "pendiente",
  ...over,
});

const collections: CollectionItem[] = [
  item({ paymentId: "p-soon", company: "Acme", amount: 5000, dueDate: isoInDays(3), daysLeft: 3, status: "pendiente" }),
  item({ paymentId: "p-late", company: "Beta", amount: 8000, dueDate: isoInDays(-10), daysLeft: -10, status: "vencido" }),
];

describe("CobranzaSection", () => {
  it("defaults to 'Esta semana' and shows only pending items due within 7 days", () => {
    render(<CobranzaSection collections={collections} />);
    expect(screen.getByRole("button", { name: "Esta semana" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();
  });

  it("shows overdue items under 'Vencidos' with the total", async () => {
    const user = userEvent.setup();
    render(<CobranzaSection collections={collections} />);

    await user.click(screen.getByRole("button", { name: "Vencidos" }));

    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    // $8,000 shows both on the row and in the view total.
    expect(screen.getAllByText(/\$8,000/).length).toBeGreaterThan(0);
  });

  it("renders an empty state when a view has nothing", async () => {
    const user = userEvent.setup();
    render(<CobranzaSection collections={[collections[0]]} />);

    await user.click(screen.getByRole("button", { name: "Vencidos" }));
    expect(screen.getByText(/nada que cobrar/i)).toBeInTheDocument();
  });
});
