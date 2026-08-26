import { describe, expect, it } from "vitest";
import { formatBytes } from "./media-limits";

describe("formatBytes", () => {
  it("formats sub-megabyte sizes in whole KB", () => {
    expect(formatBytes(512 * 1024)).toBe("512 KB");
  });

  it("rounds KB to the nearest whole number", () => {
    expect(formatBytes(1500)).toBe("1 KB");
  });

  it("formats megabyte-and-above sizes with one decimal", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("treats exactly 1 MB as the MB threshold", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });

  it("handles zero bytes", () => {
    expect(formatBytes(0)).toBe("0 KB");
  });
});
