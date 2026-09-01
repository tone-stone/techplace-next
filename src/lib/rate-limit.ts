/**
 * Tiny in-memory fixed-window rate limiter for public API routes.
 *
 * State lives in a module-level Map, so it is per-process: on Vercel it is
 * shared across requests handled by the same warm serverless instance and
 * resets on cold start / redeploy, and is NOT shared between concurrent
 * instances. That is enough to blunt casual floods and scripted abuse of the
 * public endpoints (contact form, monitoring beacon); for hard guarantees
 * across a fleet, back this with Upstash/Redis instead.
 *
 * No external dependencies, no timers — stale buckets are dropped lazily on
 * the next call for that key, and the whole Map is swept when it grows past
 * `MAX_KEYS`.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export type RateLimitResult = {
  /** False when the caller is over the limit for the current window. */
  ok: boolean;
  /** Requests still allowed in this window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets — send as the `Retry-After` header. */
  retryAfterSec: number;
};

/**
 * Records one hit for `key` and reports whether it is within `limit` per
 * `windowMs`. Call once per request, early in the handler.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfterSec };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfterSec };
}

/**
 * Best-effort client IP from the proxy headers Vercel / most hosts set.
 * Falls back to a constant so a missing header buckets everyone together
 * (fail closed-ish) rather than throwing.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
