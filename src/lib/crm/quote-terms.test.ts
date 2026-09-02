import { describe, expect, it } from "vitest";
import { DEFAULT_QUOTE_TERMS, quoteTermsLines } from "./quote-terms";

describe("quoteTermsLines", () => {
  it("falls back to the default legends when terms are null/empty/whitespace", () => {
    const fromDefault = quoteTermsLines(DEFAULT_QUOTE_TERMS);
    expect(quoteTermsLines(null)).toEqual(fromDefault);
    expect(quoteTermsLines("")).toEqual(fromDefault);
    expect(quoteTermsLines("   \n  ")).toEqual(fromDefault);
    expect(fromDefault.some((l) => /sujeta a cambios/i.test(l))).toBe(true);
    expect(fromDefault.some((l) => /30 días/i.test(l))).toBe(true);
  });

  it("splits a custom blob into trimmed, non-empty lines", () => {
    expect(quoteTermsLines("  Línea uno \n\n  Línea dos  \n")).toEqual(["Línea uno", "Línea dos"]);
  });
});
