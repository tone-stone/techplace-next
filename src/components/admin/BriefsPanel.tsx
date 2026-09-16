"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  Clock,
  FileQuestion,
  Globe,
  Mail,
  Phone,
  Wallet,
} from "lucide-react";
import { updateBriefStatusAction } from "@/lib/briefs/actions";
import { BRIEF_STATUSES, type BriefStatus, type ManagedBrief } from "@/lib/briefs/types";

const STATUS_STYLE: Record<BriefStatus, string> = {
  nuevo: "border-brand-blue/30 bg-brand-blue/10 text-brand-blue",
  "en revisión": "border-amber-400/30 bg-amber-500/15 text-amber-300",
  cotizado: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  descartado: "border-red-400/30 bg-red-500/15 text-red-300",
};

const STATUS_LABEL: Record<BriefStatus, string> = {
  nuevo: "Nuevo",
  "en revisión": "En revisión",
  cotizado: "Cotizado",
  descartado: "Descartado",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-200 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function StatusSelect({
  brief,
  onChanged,
}: {
  brief: ManagedBrief;
  onChanged: (id: string, status: BriefStatus) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleChange = (status: BriefStatus) => {
    setError(null);
    onChanged(brief.id, status);
    startTransition(async () => {
      const result = await updateBriefStatusAction(brief.id, status);
      if (result && "error" in result) {
        setError(result.error);
        onChanged(brief.id, brief.status);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
      <select
        value={brief.status}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as BriefStatus)}
        style={{ colorScheme: "dark" }}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:opacity-60 ${STATUS_STYLE[brief.status]}`}
      >
        {BRIEF_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[#150c1e] text-white">
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export default function BriefsPanel({
  initialBriefs,
  canManage,
}: {
  initialBriefs: ManagedBrief[];
  canManage: boolean;
}) {
  const [briefs, setBriefs] = useState(initialBriefs);
  const [filter, setFilter] = useState<BriefStatus | "todos">("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base: Record<BriefStatus, number> = { nuevo: 0, "en revisión": 0, cotizado: 0, descartado: 0 };
    for (const b of briefs) base[b.status]++;
    return base;
  }, [briefs]);

  const filtered = filter === "todos" ? briefs : briefs.filter((b) => b.status === filter);

  const handleStatusChanged = (id: string, status: BriefStatus) => {
    setBriefs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["nuevo", "en revisión", "cotizado", "descartado"] as BriefStatus[]).map((s) => (
          <div key={s} className="tp-dark-card-admin rounded-2xl p-5">
            <p className="text-2xl font-bold">{counts[s]}</p>
            <p className="text-xs text-gray-400">{STATUS_LABEL[s]}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["todos", ...BRIEF_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "border-purple-400/50 bg-purple-500/20 text-white"
                : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200"
            }`}
          >
            {s === "todos" ? `Todos (${briefs.length})` : `${STATUS_LABEL[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((brief) => {
          const isOpen = expandedId === brief.id;
          return (
            <div
              key={brief.id}
              className="tp-dark-card-admin rounded-2xl border border-white/10 overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(isOpen ? null : brief.id)}
                className="flex cursor-pointer items-center gap-4 p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-white">{brief.fullName}</h3>
                    {brief.businessName && (
                      <span className="truncate text-xs text-gray-400">· {brief.businessName}</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {brief.projectType} · {brief.budgetRange} · {timeAgo(brief.createdAt)}
                  </p>
                </div>

                {canManage ? (
                  <StatusSelect brief={brief} onChanged={handleStatusChanged} />
                ) : (
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[brief.status]}`}
                  >
                    {STATUS_LABEL[brief.status]}
                  </span>
                )}

                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>

              {isOpen && (
                <div className="border-t border-white/10 p-4 sm:p-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Email" value={brief.email} />
                    <DetailRow label="Teléfono" value={brief.phone} />
                    <DetailRow label="Giro / industria" value={brief.industry} />
                    <DetailRow
                      label="Sitio actual"
                      value={brief.hasWebsite ? brief.currentWebsiteUrl || "Sí, sin URL indicada" : "No tiene"}
                    />
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-purple-300">
                      <Briefcase className="h-4 w-4" /> Proyecto y objetivos
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Tipo de proyecto" value={brief.projectType} />
                      <DetailRow label="Objetivo" value={brief.projectGoal} />
                      <DetailRow label="Público objetivo" value={brief.targetAudience} />
                      <DetailRow label="Problema a resolver" value={brief.problemToSolve} />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-purple-300">
                      <FileQuestion className="h-4 w-4" /> Alcance
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Páginas estimadas" value={brief.pagesEstimate} />
                      <DetailRow label="Pasarela de pago" value={brief.paymentGateway} />
                      <DetailRow label="Integraciones" value={brief.integrations} />
                    </div>
                    {brief.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {brief.features.map((f) => (
                          <span
                            key={f}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-purple-300">
                      <Globe className="h-4 w-4" /> Diseño y contenido
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Marca / logo" value={brief.hasBranding} />
                      <DetailRow label="Contenido listo" value={brief.contentReady} />
                      <DetailRow label="Estilo visual" value={brief.visualStyle} />
                      <DetailRow label="Sitios de referencia" value={brief.referenceSites} />
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-purple-300">
                      <Wallet className="h-4 w-4" /> Técnico, presupuesto y tiempos
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Dominio y hosting" value={brief.hasDomainHosting} />
                      <DetailRow label="Preferencia técnica" value={brief.techPreference} />
                      <DetailRow label="Mantenimiento" value={brief.needsMaintenance} />
                      <DetailRow label="Presupuesto" value={brief.budgetRange} />
                      <DetailRow label="Tiempo esperado" value={brief.timeline} />
                    </div>
                    <div className="mt-4">
                      <DetailRow label="Notas adicionales" value={brief.additionalNotes} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-white/5 pt-4 text-xs text-gray-400">
                    <a href={`mailto:${brief.email}`} className="inline-flex items-center gap-1.5 hover:text-purple-300">
                      <Mail className="h-3.5 w-3.5" /> {brief.email}
                    </a>
                    <a
                      href={`https://wa.me/${brief.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-purple-300"
                    >
                      <Phone className="h-3.5 w-3.5" /> {brief.phone}
                    </a>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Recibido {timeAgo(brief.createdAt)}
                    </span>
                    {brief.businessName && (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> {brief.businessName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">No hay cotizaciones en este filtro todavía.</p>
        )}
      </div>
    </div>
  );
}
