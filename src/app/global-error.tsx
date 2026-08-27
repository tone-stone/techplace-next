"use client";

import { useEffect } from "react";
import { reportEvent } from "@/lib/monitoring/client";

// Catches errors thrown by the root layout itself — replaces the whole
// document when active, so it can't rely on globals.css or the site's fonts
// being loaded. Inline styles only, on purpose.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    reportEvent({
      kind: "error",
      source: "client",
      level: "error",
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#0a0a18",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Algo salió mal</h2>
        <p style={{ color: "#9ca3af", maxWidth: "28rem", margin: 0 }}>
          Ocurrió un error inesperado. Ya quedó registrado — intenta de nuevo.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            borderRadius: "9999px",
            padding: "0.75rem 1.5rem",
            fontWeight: 700,
            color: "#ffffff",
            background: "linear-gradient(90deg, #7e22ce, #4338ca)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Intentar de nuevo
        </button>
      </body>
    </html>
  );
}
