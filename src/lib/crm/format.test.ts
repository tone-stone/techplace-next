import { describe, expect, it } from "vitest";
import { formatCurrencyMXN } from "./format";

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
