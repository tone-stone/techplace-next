import { describe, expect, it } from "vitest";
import { SLA_HOURS, slaDueAt } from "./ticket-types";

describe("slaDueAt", () => {
  const from = new Date("2026-08-31T09:00:00.000Z");

  it("adds the priority window to the start instant", () => {
    expect(slaDueAt("critica", from)).toBe("2026-08-31T13:00:00.000Z"); // +4h
    expect(slaDueAt("alta", from)).toBe("2026-08-31T17:00:00.000Z"); // +8h
    expect(slaDueAt("media", from)).toBe("2026-09-01T09:00:00.000Z"); // +24h
    expect(slaDueAt("baja", from)).toBe("2026-09-03T09:00:00.000Z"); // +72h
  });

  it("matches the SLA_HOURS table", () => {
    for (const [priority, hours] of Object.entries(SLA_HOURS)) {
      const due = new Date(slaDueAt(priority as keyof typeof SLA_HOURS, from)).getTime();
      expect(due - from.getTime()).toBe(hours * 3_600_000);
    }
  });
});
