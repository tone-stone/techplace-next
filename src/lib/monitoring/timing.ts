import { after } from "next/server";
import { logSlowOperation } from "./server";

/**
 * Slow-query detection helper for server-side code. `withTiming` wraps a
 * single async operation, measures its duration, and reports it as a
 * `"timing"` monitoring event only when it crosses a threshold — it is not a
 * full trace log, just a bottleneck detector.
 */

const DEFAULT_THRESHOLD_MS = 300;

/**
 * Runs `fn` and, if it takes at least `thresholdMs`, logs it as a slow
 * operation under `label`. Logging happens via `after()` so it never adds
 * latency to the request that's waiting on `fn()` — the awaited result is
 * returned unchanged regardless of duration.
 *
 * @param label Human-readable name for the operation, stored as the event message.
 * @param thresholdMs Minimum duration (ms) before the operation is logged. Defaults to 300ms.
 */
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
