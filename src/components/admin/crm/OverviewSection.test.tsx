import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import OverviewSection from "./OverviewSection";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import type { CrmProject } from "@/lib/crm/projects";
import type { CrmExpense } from "@/lib/crm/expense-types";
import type { ScheduledCharge } from "@/lib/crm/collections";

/** YYYY-MM-DD in the current calendar month (day 10, safe for any month). */
function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-10`;
}

const client: CrmClient = {
  id: "cli-1",
  name: "Contacto",
  company: "Tijuana Innovadora",
  email: null,
  phone: null,
  status: "activo",
  service: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00Z",
};

const paidPayment: ClientPayment = {
  id: "pay-aug",
  clientId: "cli-1",
  planId: null,
  amount: 2500,
  status: "pagado",
  dueDate: thisMonth(),
  paidDate: thisMonth(),
  method: "transferencia",
  notes: null,
  createdAt: "2026-08-01T00:00:00Z",
};

const hostingExpense: CrmExpense = {
  id: "exp-hosting",
  clientId: "cli-1",
  planId: null,
  paymentId: "pay-aug",
  category: "hosting",
  concept: "Hosting sitio web",
  amount: 2500,
  expenseDate: thisMonth(),
  vendor: "Vercel",
  method: null,
  notes: null,
  status: "pagado",
  paidDate: thisMonth(),
  createdAt: "2026-08-05T00:00:00Z",
};

const septemberCharge: ScheduledCharge = {
  planId: "plan-1",
  clientId: "cli-1",
  company: "Tijuana Innovadora",
  contactName: null,
  planName: "Sitio web + hosting",
  amount: 2500,
  billingCycle: "mensual",
  nextDueDate: "2026-09-25",
  daysLeft: 24,
};

/** Value shown inside the KPI tile whose label matches `label`. */
function tileValue(label: string): string {
  return within(screen.getByText(label).parentElement as HTMLElement)
    .getAllByText(/\$/)[0]!.textContent!.trim();
}

describe("OverviewSection money strip", () => {
  it("shows egresos this month, nets cobrado − egresos to zero, and rolls the scheduled charge into 'Por cobrar'", () => {
    render(
      <OverviewSection
        clients={[client]}
        projects={[] as CrmProject[]}
        payments={[paidPayment]}
        expenses={[hostingExpense]}
        scheduledCharges={[septemberCharge]}
      />
    );

    expect(tileValue("Cobrado este mes")).toBe("$2,500");
    expect(tileValue("Egresos este mes")).toBe("$2,500");
    expect(tileValue("Neto este mes")).toBe("$0");
    expect(tileValue("Por cobrar")).toBe("$2,500");
  });

  it("falls back to zero-cost tiles when no expenses or scheduled charges are passed", () => {
    render(
      <OverviewSection clients={[client]} projects={[] as CrmProject[]} payments={[paidPayment]} />
    );

    expect(tileValue("Egresos este mes")).toBe("$0");
    expect(tileValue("Neto este mes")).toBe("$2,500");
    expect(tileValue("Por cobrar")).toBe("$0");
  });
});
