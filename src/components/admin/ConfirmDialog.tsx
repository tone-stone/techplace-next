"use client";

/**
 * Modal confirmation for destructive actions. Every delete in the dashboard
 * routes through this: it states what will be removed and reminds the user
 * it's recoverable from Monitoreo → Eliminaciones. Esc / backdrop / Cancelar
 * dismiss; the confirm button runs `onConfirm` and shows a pending state.
 */

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Eliminar",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => !pending && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0b18] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <p className="text-base font-bold text-white">{title}</p>
        </div>
        <p className="mb-5 text-sm text-gray-400">
          {body ? `${body} ` : ""}
          Queda registrado y se puede restaurar desde Monitoreo → Eliminaciones.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 transition-colors hover:border-white/25 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await onConfirm();
                onClose();
              } finally {
                setPending(false);
              }
            }}
            className="cursor-pointer rounded-full border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {pending ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
