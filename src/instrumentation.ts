import type { Instrumentation } from "next";

// Catches errors from Server Components, Route Handlers, Server Actions and
// Proxy automatically — no need to wrap every existing try/catch by hand.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { logServerError } = await import("@/lib/monitoring/server");

  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  await logServerError({
    kind: "error",
    source: "server",
    level: "error",
    path: request.path,
    routeType: context.routeType,
    message,
    stack,
    digest,
  });
};
