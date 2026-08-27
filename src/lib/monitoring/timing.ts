import { after } from "next/server";
import { logSlowOperation } from "./server";

const DEFAULT_THRESHOLD_MS = 300;

// Wraps a server-side operation (a Supabase query, typically) and logs it
// only when it's actually slow — this isn't a full trace log, just a
// bottleneck detector. Logging happens via `after()` so it never adds
// latency to the request that's waiting on `fn()`.
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  thresholdMs = DEFAULT_THRESHOLD_MS
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  if (duration >= thresholdMs) {
    after(() => logSlowOperation({ label, durationMs: duration }));
  }
  return result;
}
