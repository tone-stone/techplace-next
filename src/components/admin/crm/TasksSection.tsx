"use client";

/**
 * "Tareas" tab: a per-project kanban board (Por hacer / En progreso /
 * Terminado) with left/right column-move buttons instead of drag-and-drop,
 * plus an inline "Nueva tarea" form.
 */

import { useActionState, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import {
  createTaskAction,
  getAllTasks,
  updateTaskStatusAction,
  type CrmTask,
  type TaskStatus,
} from "@/lib/crm/tasks";
import type { CrmActionState } from "@/lib/crm/clients";
import type { CrmProject } from "@/lib/crm/projects";
import { getDueDateUrgency } from "@/lib/crm/plan-status";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "por_hacer", label: "Por hacer" },
  { status: "en_progreso", label: "En progreso" },
  { status: "terminado", label: "Terminado" },
];

function urgencyBadgeClass(urgency: ReturnType<typeof getDueDateUrgency>) {
  if (urgency === "vencido") return "border-red-400/30 bg-red-500/10 text-red-300";
  if (urgency === "por_vencer") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
}

/**
 * Kanban board for tasks, scoped to one project at a time via a dropdown.
 * Moving a task optimistically updates local state before the server action
 * resolves.
 */
export default function TasksSection({
  tasks: initialTasks,
  projects,
}: {
  tasks: CrmTask[];
  projects: CrmProject[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [showNewForm, setShowNewForm] = useState(false);

  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const refresh = async () => {
    setTasks(await getAllTasks());
  };

  const handleMove = async (task: CrmTask, direction: -1 | 1) => {
    const currentIndex = COLUMNS.findIndex((c) => c.status === task.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;
    const nextStatus = COLUMNS[nextIndex].status;

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    await updateTaskStatusAction(task.id, nextStatus);
  };

  if (projects.length === 0) {
    return (
      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <h2 className="mb-2 text-lg font-bold text-white">Tareas</h2>
        <p className="text-sm text-gray-400">Crea un proyecto primero para poder darle seguimiento a tareas.</p>
      </div>
    );
  }

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Tareas</h2>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white outline-none focus:border-sky-400/40"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm((o) => !o)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4" /> Nueva tarea
        </button>
      </div>

      {showNewForm && (
        <NewTaskForm
          projectId={projectId}
          onCreated={refresh}
          onDone={() => setShowNewForm(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((column, columnIndex) => (
          <div key={column.status} className="rounded-xl border border-white/5 bg-white/2 p-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">{column.label}</p>
            <div className="space-y-2">
              {projectTasks
                .filter((t) => t.status === column.status)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canMoveLeft={columnIndex > 0}
                    canMoveRight={columnIndex < COLUMNS.length - 1}
                    onMove={(direction) => handleMove(task, direction)}
                  />
                ))}
              {projectTasks.filter((t) => t.status === column.status).length === 0 && (
                <p className="text-xs text-gray-500">Sin tareas.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One kanban card: title, assignee, due-date urgency badge, and column-move buttons. */
function TaskCard({
  task,
  canMoveLeft,
  canMoveRight,
  onMove,
}: {
  task: CrmTask;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (direction: -1 | 1) => void;
}) {
  const urgency = useMemo(() => (task.dueDate ? getDueDateUrgency(task.dueDate) : null), [task.dueDate]);

  return (
    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
      <p className="text-sm font-medium text-white">{task.title}</p>
      {task.description && <p className="mt-1 text-xs text-gray-400">{task.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" /> {task.assignee}
          </span>
        )}
        {task.dueDate && urgency && (
          <span className={`rounded-full border px-2 py-0.5 font-medium ${urgencyBadgeClass(urgency)}`}>
            <Calendar className="mr-1 inline h-3 w-3" /> {task.dueDate}
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-end gap-1">
        <button
          type="button"
          disabled={!canMoveLeft}
          onClick={() => onMove(-1)}
          aria-label="Mover a la columna anterior"
          className="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-20"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canMoveRight}
          onClick={() => onMove(1)}
          aria-label="Mover a la siguiente columna"
          className="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-20"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Inline form for `createTaskAction`; refetches the task list and collapses itself on success. */
function NewTaskForm({
  projectId,
  onCreated,
  onDone,
}: {
  projectId: string;
  onCreated: () => Promise<void>;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await createTaskAction(prevState, formData);
    if (result && "success" in result) {
      await onCreated();
      onDone();
    }
    return result;
  }, null);

  return (
    <form action={formAction} className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Título de la tarea"
          className="col-span-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40 sm:col-span-2"
        />
        <input
          name="assignee"
          placeholder="Asignado a (opcional)"
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
          Guardar tarea
        </button>
      </div>
    </form>
  );
}
