"use client";

/**
 * Modal confirmation dialog. Two tones:
 *  - `danger` (default): destructive actions. Every delete in the dashboard
 *    routes through this — it states what will be removed and reminds the user
 *    it's recoverable from Monitoreo → Eliminaciones.
 *  - `info`: non-destructive confirmations (e.g. "add this service to the
 *    client?"). No recovery note, neutral button.
 * Esc / backdrop / Cancelar dismiss; the confirm button runs `onConfirm` and
 * shows a pending state.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  body,
  tone = "danger",
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  tone?: "danger" | "info";
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const danger = tone === "danger";
  const label = confirmLabel ?? (danger ? "Eliminar" : "Confirmar");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  const Icon = danger ? AlertTriangle : HelpCircle;

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
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              danger
                ? "border-red-400/30 bg-red-500/10 text-red-300"
                : "border-sky-400/30 bg-sky-500/10 text-sky-300"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-base font-bold text-white">{title}</p>
        </div>
        <p className="mb-5 text-sm text-gray-400">
          {body ? `${body} ` : ""}
          {danger && "Queda registrado y se puede restaurar desde Monitoreo → Eliminaciones."}
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
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              danger
                ? "border-red-400/40 bg-red-500/15 text-red-200 hover:bg-red-500/25"
                : "border-sky-400/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
            }`}
          >
            {pending ? (danger ? "Eliminando…" : "Guardando…") : label}
          </button>
        </div>
      </div>
    </div>
  );
}
