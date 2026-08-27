"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import {
  getProjectDetail,
  updateProjectProgressAction,
  updateProjectStatusAction,
  type CrmProject,
  type ProjectStatus,
} from "@/lib/crm/projects";
import { formatCurrencyMXN } from "@/lib/crm/format";
import type { CrmClient } from "@/lib/crm/clients";
import StatusBadge from "./StatusBadge";
import ModalPortal from "./ModalPortal";

const STATUS_OPTIONS: ProjectStatus[] = ["planeacion", "en_progreso", "revision", "completado"];

export default function ProjectDetailModal({
  projectId,
  clients,
  onClose,
}: {
  projectId: string;
  clients: CrmClient[];
  onClose: () => void;
}) {
  const [project, setProject] = useState<CrmProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [progressDraft, setProgressDraft] = useState(0);

  const refresh = async () => {
    const data = await getProjectDetail(projectId);
    setProject(data);
    if (data) setProgressDraft(data.progress);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleStatusChange = async (status: ProjectStatus) => {
    if (!project) return;
    setSavingStatus(true);
    await updateProjectStatusAction(project.id, project.clientId, status);
    await refresh();
    setSavingStatus(false);
  };

  const commitProgress = async () => {
    if (!project) return;
    await updateProjectProgressAction(project.id, progressDraft);
    await refresh();
  };

  const client = project ? clients.find((c) => c.id === project.clientId) : null;

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="tp-dark-card-crm relative my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 -m-2 cursor-pointer rounded-full p-2 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {loading || !project ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando proyecto…
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-gray-400">{client?.company ?? "—"}</p>
              {project.description && <p className="mt-2 text-sm text-gray-300">{project.description}</p>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {project.dueDate ? `Entrega ${project.dueDate}` : "Sin fecha"}
                </span>
                <span className="font-semibold text-gray-300">{formatCurrencyMXN(project.budget)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Estado</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={savingStatus}
                    onClick={() => handleStatusChange(status)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      project.status === status
                        ? "border-sky-400 bg-sky-500/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-sky-400/40 hover:text-white"
                    }`}
                  >
                    <StatusBadge status={status} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Avance</p>
                <p className="text-sm font-semibold text-white">{progressDraft}%</p>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressDraft}
                onChange={(e) => setProgressDraft(Number(e.target.value))}
                onMouseUp={commitProgress}
                onTouchEnd={commitProgress}
                onBlur={commitProgress}
                className="w-full accent-sky-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
