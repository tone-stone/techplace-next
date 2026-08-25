"use client";

import { ShieldCheck, User } from "lucide-react";
import type { DashboardRole } from "./types";

export default function RolePreviewSwitch({
  role,
  onChange,
  compact = false,
}: {
  role: DashboardRole;
  onChange: (role: DashboardRole) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div>
        <p className="mb-2 px-1 text-[10px] uppercase tracking-wide text-gray-500">Previsualizar rol</p>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/2 p-1">
          <button
            type="button"
            onClick={() => onChange("redactor")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
              role === "redactor" ? "bg-indigo-500/20 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <User className="h-3.5 w-3.5" /> Redactor
          </button>
          <button
            type="button"
            onClick={() => onChange("admin")}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors ${
              role === "admin" ? "bg-purple-500/20 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/2 p-1">
        <button
          type="button"
          onClick={() => onChange("redactor")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            role === "redactor" ? "bg-indigo-500/20 text-white" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <User className="h-3.5 w-3.5" /> Redactor
        </button>
        <button
          type="button"
          onClick={() => onChange("admin")}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            role === "admin" ? "bg-purple-500/20 text-white" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Administrador
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Previsualización de permisos — se activará por cuenta cuando conectemos el backend.
      </p>
    </div>
  );
}
