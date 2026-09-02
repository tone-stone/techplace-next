import { describe, expect, it } from "vitest";
import {
  agendaDigestWhatsApp,
  collectionsDigestWhatsApp,
  paymentReminderWhatsApp,
  quoteAcceptedWhatsApp,
  quoteSentWhatsApp,
  type AgendaItem,
} from "./messages";

describe("paymentReminderWhatsApp", () => {
  it("frames an upcoming payment with the amount and date", () => {
    const msg = paymentReminderWhatsApp({
      orgName: "TechPlace",
      contactName: "Ana",
      planName: "Soporte mensual",
      amount: 2500,
      dueDate: "2026-09-15",
      daysLeft: 3,
    });
    expect(msg).toContain("Hola Ana,");
    expect(msg).toContain("2026-09-15");
    expect(msg).toContain("$2,500");
    expect(msg).toContain("TechPlace");
  });

  it("switches wording when overdue", () => {
    const msg = paymentReminderWhatsApp({
      orgName: "TechPlace",
      contactName: null,
      planName: null,
      amount: 999,
      dueDate: "2026-08-01",
      daysLeft: -5,
    });
    expect(msg).toMatch(/vencido/i);
  });
});

describe("collectionsDigestWhatsApp", () => {
  it("lists overdue rows and omits empty sections", () => {
    const msg = collectionsDigestWhatsApp({
      orgName: "TechPlace",
      generated: 1,
      markedOverdue: 2,
      overdue: [{ company: "Acme", amount: 5000, dueDate: "2026-08-10" }],
      dueThisWeek: [],
    });
    expect(msg).toContain("Acme");
    expect(msg).toContain("Vencidos (1)");
    expect(msg).not.toContain("Por vencer esta semana");
  });
});

describe("quote messages", () => {
  it("quoteSentWhatsApp names the folio and total", () => {
    const msg = quoteSentWhatsApp({
      orgName: "TechPlace",
      number: "COT-2026-004",
      contactName: "Luis",
      total: 11600,
      validUntil: "2026-10-01",
    });
    expect(msg).toContain("COT-2026-004");
    expect(msg).toContain("$11,600");
    expect(msg).toContain("2026-10-01");
  });

  it("quoteAcceptedWhatsApp is an internal alert", () => {
    const msg = quoteAcceptedWhatsApp({
      orgName: "TechPlace",
      number: "COT-2026-004",
      clientName: "Acme",
      total: 11600,
    });
    expect(msg).toMatch(/aceptada/i);
    expect(msg).toContain("Acme");
  });
});

describe("agendaDigestWhatsApp", () => {
  it("renders one bullet per item with a relative due label", () => {
    const items: AgendaItem[] = [
      { kind: "tarea", title: "Renovar dominio", company: "Acme", date: "2026-09-03", daysLeft: 1 },
      { kind: "soporte", title: "TK-9 · Caída", company: null, date: "2026-09-02", daysLeft: 0 },
    ];
    const msg = agendaDigestWhatsApp({ orgName: "TechPlace", items });
    expect(msg).toContain("2 pendiente(s)");
    expect(msg).toContain("Renovar dominio");
    expect(msg).toMatch(/vence mañana/);
    expect(msg).toMatch(/vence hoy/);
  });
});
