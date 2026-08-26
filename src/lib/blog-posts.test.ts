import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_ICONS, formatPostDate } from "./blog-posts";

describe("CATEGORY_ICONS / CATEGORIES", () => {
  it("has a matching icon for every listed category", () => {
    for (const category of CATEGORIES) {
      expect(CATEGORY_ICONS[category]).toBeDefined();
    }
  });

  it("keeps CATEGORIES in sync with the icon map's keys", () => {
    expect(CATEGORIES).toEqual(Object.keys(CATEGORY_ICONS));
  });
});

describe("formatPostDate", () => {
  it("formats an ISO date string in long Spanish (Mexico) form", () => {
    expect(formatPostDate("2026-08-25")).toBe("25 de agosto de 2026");
  });

  it("does not shift the date across a UTC day boundary", () => {
    // Regression guard: parsing "YYYY-MM-DD" as UTC midnight, then formatting
    // in a UTC-behind timezone, can silently roll the date back a day.
    expect(formatPostDate("2026-01-01")).toContain("1 de enero de 2026");
  });
});
