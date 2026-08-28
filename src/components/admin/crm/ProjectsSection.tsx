"use client";

/**
 * "Proyectos" tab: a card grid of projects with progress bars and an inline
 * "Nuevo proyecto" form, opening `ProjectDetailModal` for status/progress
 * updates.
 */

import { useActionState, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { formatCurrencyMXN } from "@/lib/crm/format";
import { createProjectAction, type CrmProject } from "@/lib/crm/projects";
import type { CrmActionState, CrmClient } from "@/lib/crm/clients";
import StatusBadge from "./StatusBadge";
import ProjectDetailModal from "./ProjectDetailModal";

/** Renders the project card grid and the "new project" form. */
export default function ProjectsSection({
  projects,
  clients,
}: {
  projects: CrmProject[];
  clients: CrmClient[];
}) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const clientName = (clientId: string) => clients.find((c) => c.id === clientId)?.company ?? "—";

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Proyectos ({projects.length})</h2>
        <button
          type="button"
          onClick={() => setShowNewForm((o) => !o)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4" /> Nuevo proyecto
        </button>
      </div>

      {showNewForm && <NewProjectForm clients={clients} onDone={() => setShowNewForm(false)} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setSelectedId(project.id)}
            className="cursor-pointer rounded-xl border border-white/5 bg-white/2 p-4 text-left transition-colors hover:border-sky-400/30"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{project.name}</p>
                <p className="text-xs text-gray-400">{clientName(project.clientId)}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>

            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-sky-400" style={{ width: `${project.progress}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {project.dueDate ? `Entrega ${project.dueDate}` : "Sin fecha"}
              </span>
              <span className="font-semibold text-gray-300">{formatCurrencyMXN(project.budget)}</span>
            </div>
          </button>
        ))}

        {projects.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400 sm:col-span-2">
            No hay proyectos todavía.
          </p>
        )}
      </div>

      {selectedId && (
        <ProjectDetailModal
          projectId={selectedId}
          clients={clients}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

/** Inline form for `createProjectAction`; calls `onDone` on success to collapse itself. */
function NewProjectForm({ clients, onDone }: { clients: CrmClient[]; onDone: () => void }) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await createProjectAction(prevState, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form action={formAction} className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select
          name="clientId"
          required
          defaultValue=""
          className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 sm:col-span-2"
        >
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company} — {c.name}
            </option>
          ))}
        </select>
        <input
          name="name"
          required
          placeholder="Nombre del proyecto"
          className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:col-span-2"
        />
        <input
          name="budget"
          type="number"
          min="0"
          step="0.01"
          placeholder="Presupuesto MXN"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <input
          name="dueDate"
          type="date"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
        />
        <input
          name="description"
          placeholder="Descripción (opcional)"
          className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:col-span-2"
        />
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Guardar proyecto
        </button>
      </div>
    </form>
  );
}
