import { describe, expect, it } from "vitest";
import { daysUntil, getDueDateUrgency } from "./plan-status";

const TODAY = new Date("2026-08-25T12:00:00");

describe("getDueDateUrgency", () => {
  it("is 'vencido' for a date in the past", () => {
    expect(getDueDateUrgency("2026-08-20", TODAY)).toBe("vencido");
  });

  it("is 'vencido' for yesterday", () => {
    expect(getDueDateUrgency("2026-08-24", TODAY)).toBe("vencido");
  });

  it("is 'por_vencer' for today", () => {
    expect(getDueDateUrgency("2026-08-25", TODAY)).toBe("por_vencer");
  });

  it("is 'por_vencer' within the next 7 days", () => {
    expect(getDueDateUrgency("2026-09-01", TODAY)).toBe("por_vencer");
  });

  it("is 'al_dia' more than 7 days out", () => {
    expect(getDueDateUrgency("2026-09-02", TODAY)).toBe("al_dia");
  });

  it("is 'al_dia' far in the future", () => {
    expect(getDueDateUrgency("2027-01-01", TODAY)).toBe("al_dia");
  });
});

describe("daysUntil", () => {
  it("returns 0 for today", () => {
    expect(daysUntil("2026-08-25", TODAY)).toBe(0);
  });

  it("returns a positive count for future dates", () => {
    expect(daysUntil("2026-08-30", TODAY)).toBe(5);
  });

  it("returns a negative count for past dates", () => {
    expect(daysUntil("2026-08-20", TODAY)).toBe(-5);
  });
});
