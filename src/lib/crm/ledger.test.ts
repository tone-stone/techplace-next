import { describe, expect, it } from "vitest";
import { buildClientLedger } from "./ledger";
import type { ClientPayment, ClientPlan } from "./clients";
import type { CrmInvoice } from "./invoices";

const payment = (over: Partial<ClientPayment>): ClientPayment => ({
  id: "pay-1",
  clientId: "cli-1",
  planId: null,
  amount: 2500,
  status: "pagado",
  dueDate: "2026-08-01",
  paidDate: "2026-08-26",
  method: "transferencia",
  notes: null,
  createdAt: "2026-08-01T00:00:00Z",
  ...over,
});

const plan = (over: Partial<ClientPlan>): ClientPlan => ({
  id: "plan-1",
  clientId: "cli-1",
  name: "Soporte de sitio web",
  amount: 2500,
  billingCycle: "mensual",
  cutoffDay: 30,
  nextDueDate: "2026-09-30",
  status: "activo",
  contractId: null,
  createdAt: "2026-08-05T12:00:00Z",
  ...over,
});

const invoice = (over: Partial<CrmInvoice>): CrmInvoice => ({
  id: "inv-1",
  clientId: "cli-1",
  projectId: null,
  paymentId: "pay-1",
  number: "TP-2026-002",
  amount: 2500,
  status: "pagada",
  issuedDate: "2026-08-26",
  dueDate: "2026-08-01",
  notes: null,
  createdAt: "2026-08-26T00:00:00Z",
  ...over,
});

describe("buildClientLedger", () => {
  it("merges cobros and servicios ordered by date, newest first", () => {
    const rows = buildClientLedger(
      [payment({ id: "pay-aug", paidDate: "2026-08-26" })],
      [plan({ id: "plan-jul", createdAt: "2026-07-01T00:00:00Z" })]
    );
    expect(rows.map((r) => r.id)).toEqual(["pay-aug", "plan-jul"]);
    expect(rows.map((r) => r.kind)).toEqual(["cobro", "servicio"]);
  });

  it("uses the due date for a still-pending charge and carries its status", () => {
    const [row] = buildClientLedger(
      [payment({ id: "pay-sep", status: "pendiente", paidDate: null, dueDate: "2026-09-30" })],
      []
    );
    expect(row.date).toBe("2026-09-30");
    expect(row.status).toBe("pendiente");
    expect(row.amount).toBe(2500);
  });

  it("labels a contracted service with its cycle and next charge date", () => {
    const [row] = buildClientLedger([], [plan({ name: "Mantenimiento", nextDueDate: "2026-09-30" })]);
    expect(row.kind).toBe("servicio");
    expect(row.label).toBe("Contrató: Mantenimiento");
    expect(row.detail).toBe("mensual · próximo cobro 2026-09-30");
    expect(row.date).toBe("2026-08-05");
  });

  it("surfaces the folio of an invoice generated from a charge", () => {
    const rows = buildClientLedger([payment({ id: "pay-1" })], [], [invoice({ paymentId: "pay-1" })]);
    expect(rows[0].invoiceNumber).toBe("TP-2026-002");
  });

  it("puts the cobro above the servicio when they share a date", () => {
    const rows = buildClientLedger(
      [payment({ id: "pay-x", paidDate: "2026-08-05" })],
      [plan({ id: "plan-x", createdAt: "2026-08-05T09:00:00Z" })]
    );
    expect(rows.map((r) => r.id)).toEqual(["pay-x", "plan-x"]);
  });
});
