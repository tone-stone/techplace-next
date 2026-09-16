import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpcomingCalendar, { type CalEvent } from "./UpcomingCalendar";

/** YYYY-MM-DD for the 15th of the current month. */
function midThisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`;
}

const events: CalEvent[] = [
  { id: "a", date: midThisMonth(), kind: "cobro", label: "$2,500", sub: "Acme" },
  { id: "b", date: midThisMonth(), kind: "tarea", label: "Actualizar dominio" },
];

describe("UpcomingCalendar", () => {
  it("shows the current month and plots events on their day", () => {
    render(<UpcomingCalendar events={events} />);
    const now = new Date();
    const monthName = now.toLocaleDateString("es-MX", { month: "long" });
    expect(
      screen.getByText(new RegExp(monthName, "i"))
    ).toBeInTheDocument();
    expect(screen.getByText(/\$2,500/)).toBeInTheDocument();
    expect(screen.getByText("Actualizar dominio")).toBeInTheDocument();
    expect(screen.getByText(/2 eventos/)).toBeInTheDocument();
  });

  it("navigates to the next month (where there are no events)", async () => {
    const user = userEvent.setup();
    render(<UpcomingCalendar events={events} />);

    await user.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(screen.queryByText(/\$2,500/)).not.toBeInTheDocument();
    expect(screen.getByText(/0 eventos/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hoy" }));
    expect(screen.getByText(/\$2,500/)).toBeInTheDocument();
  });

  it("renders a legend for the four event kinds", () => {
    render(<UpcomingCalendar events={[]} />);
    for (const name of ["Cobros", "Tareas", "Proyectos", "Soporte (SLA)"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });
});
