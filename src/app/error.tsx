"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { reportEvent } from "@/lib/monitoring/client";

export default function Error({
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
      path: window.location.pathname,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <h2 className="font-heading text-2xl font-bold">Algo salió mal</h2>
      <p className="max-w-md text-gray-400">
        Ocurrió un error inesperado. Ya quedó registrado — intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="tp-btn-animated inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105"
      >
        <RefreshCw className="h-4 w-4" />
        Intentar de nuevo
      </button>
    </div>
  );
}
