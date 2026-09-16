import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const opts = { limit: 3, windowMs: 1000 };
  // Unique key per test so the module-level Map doesn't leak state between them.
  const key = () => `test:${Math.random()}`;

  it("allows up to the limit, then blocks", () => {
    const k = key();
    expect(rateLimit(k, opts)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimit(k, opts)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit(k, opts)).toMatchObject({ ok: true, remaining: 0 });
    expect(rateLimit(k, opts)).toMatchObject({ ok: false, remaining: 0 });
  });

  it("reports a retry-after within the window", () => {
    const k = key();
    rateLimit(k, opts);
    const blocked = (() => {
      for (let i = 0; i < 5; i++) rateLimit(k, opts);
      return rateLimit(k, opts);
    })();
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(1);
  });

  it("resets after the window elapses", () => {
    const k = key();
    rateLimit(k, opts);
    rateLimit(k, opts);
    rateLimit(k, opts);
    expect(rateLimit(k, opts).ok).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(rateLimit(k, opts)).toMatchObject({ ok: true, remaining: 2 });
  });

  it("tracks keys independently", () => {
    const a = key();
    const b = key();
    rateLimit(a, opts);
    rateLimit(a, opts);
    rateLimit(a, opts);
    expect(rateLimit(a, opts).ok).toBe(false);
    expect(rateLimit(b, opts).ok).toBe(true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("https://x.test", { headers });

  it("takes the first hop of x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("returns 'unknown' with no proxy headers", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});
