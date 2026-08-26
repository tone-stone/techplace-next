import { describe, expect, it } from "vitest";
import { formatCurrencyMXN, MOCK_CLIENTS, MOCK_INVOICES, MOCK_PROJECTS } from "./mock-data";

describe("formatCurrencyMXN", () => {
  it("formats whole pesos with the MXN symbol and no decimals", () => {
    expect(formatCurrencyMXN(45000)).toBe("$45,000");
  });

  it("adds thousands separators", () => {
    const formatted = formatCurrencyMXN(128000);
    expect(formatted).toContain("128,000");
  });

  it("handles zero", () => {
    expect(formatCurrencyMXN(0)).toContain("0");
  });
});

describe("mock CRM data shape", () => {
  it("every client has a non-empty id, name, and company", () => {
    for (const client of MOCK_CLIENTS) {
      expect(client.id).toBeTruthy();
      expect(client.name).toBeTruthy();
      expect(client.company).toBeTruthy();
    }
  });

  it("every project references a positive budget", () => {
    for (const project of MOCK_PROJECTS) {
      expect(project.budget).toBeGreaterThan(0);
    }
  });

  it("every invoice references a positive amount", () => {
    for (const invoice of MOCK_INVOICES) {
      expect(invoice.amount).toBeGreaterThan(0);
    }
  });

  it("ids are unique within each collection", () => {
    expect(new Set(MOCK_CLIENTS.map((c) => c.id)).size).toBe(MOCK_CLIENTS.length);
    expect(new Set(MOCK_PROJECTS.map((p) => p.id)).size).toBe(MOCK_PROJECTS.length);
    expect(new Set(MOCK_INVOICES.map((i) => i.id)).size).toBe(MOCK_INVOICES.length);
  });
});
