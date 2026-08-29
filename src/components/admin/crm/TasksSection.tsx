"use client";

/**
 * "Tareas" tab: a lightweight Trello-style board. Two views —
 *
 *  - "Por proyecto": one project's board, with a per-column "Añadir tarjeta"
 *    quick composer.
 *  - "Mis tareas": every task assigned to the signed-in user, across all
 *    projects, each card tagged with its project.
 *
 * Three status columns (Por hacer / En progreso / Terminado); cards drag
 * between columns (native HTML5 drag-and-drop) with left/right move buttons
 * as the touch / keyboard fallback. Tasks can be assigned to a CRM account
 * from the card or the "Nueva tarea" form. Moves and assignment changes
 * update local state optimistically before the server action resolves.
 */

import { useActionState, useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
  createTaskAction,
  getAllTasks,
  deleteTaskAction,
  updateTaskAssigneeAction,
  updateTaskStatusAction,
  type CrmTask,
  type TaskStatus,
} from "@/lib/crm/tasks";
import type { CrmActionState } from "@/lib/crm/clients";
import type { AssignableUser } from "@/lib/auth/users";
import { getDueDateUrgency } from "@/lib/crm/plan-status";

const COLUMNS: { status: TaskStatus; label: string; dot: string }[] = [
  { status: "por_hacer", label: "Por hacer", dot: "bg-gray-400" },
  { status: "en_progreso", label: "En progreso", dot: "bg-amber-400" },
  { status: "terminado", label: "Terminado", dot: "bg-emerald-400" },
];

function urgencyBadgeClass(urgency: ReturnType<typeof getDueDateUrgency>) {
  if (urgency === "vencido") return "border-red-400/30 bg-red-500/10 text-red-300";
  if (urgency === "por_vencer") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
}

/** "María López" -> "ML"; single word -> first two letters. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TasksSection({
  tasks: initialTasks,
  projects,
  assignees = [],
  currentUserId = "",
  defaultView = "proyecto",
  canPickAnyProject = true,
}: {
  tasks: CrmTask[];
  projects: { id: string; name: string }[];
  assignees?: AssignableUser[];
  currentUserId?: string;
  /** "mias" for roles that mostly work their own assigned tasks (blog, redactor). */
  defaultView?: "proyecto" | "mias";
  /** When false, hide the per-column quick-add (blog/redactor pick from the detail form). */
  canPickAnyProject?: boolean;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [view, setView] = useState<"proyecto" | "mias">(defaultView);
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [quickAddCol, setQuickAddCol] = useState<TaskStatus | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const resolveName = (id: string | null) =>
    id ? (assignees.find((u) => u.id === id)?.name ?? null) : null;
  const projectNameOf = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  const boardTasks =
    view === "mias"
      ? tasks.filter((t) => currentUserId && t.assigneeId === currentUserId)
      : tasks.filter((t) => t.projectId === projectId);

  const refresh = async () => {
    setTasks(await getAllTasks());
  };

  const moveTask = async (taskId: string, toStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === toStatus) return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: toStatus } : t)));
    await updateTaskStatusAction(taskId, toStatus);
  };

  const handleMoveByButton = (task: CrmTask, direction: -1 | 1) => {
    const nextIndex = COLUMNS.findIndex((c) => c.status === task.status) + direction;
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;
    void moveTask(task.id, COLUMNS[nextIndex].status);
  };

  const assignTask = async (taskId: string, assigneeId: string | null) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assigneeId, assignee: null } : t))
    );
    await updateTaskAssigneeAction(taskId, assigneeId);
  };

  const [taskToDelete, setTaskToDelete] = useState<CrmTask | null>(null);
  const removeTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteTaskAction(taskId);
  };

  if (projects.length === 0) {
    return (
      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <h2 className="mb-2 text-lg font-bold text-white">Tareas</h2>
        <p className="text-sm text-gray-400">
          Crea un proyecto primero para poder darle seguimiento a tareas.
        </p>
      </div>
    );
  }

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-white">Tareas</h2>

          <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
            {(
              [
                { id: "proyecto", label: "Por proyecto" },
                { id: "mias", label: "Mis tareas" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setView(id);
                  setQuickAddCol(null);
                }}
                aria-pressed={view === id}
                className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
                  view === id ? "bg-sky-500/15 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {view === "proyecto" && (
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
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowDetailForm((o) => !o)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4" /> Nueva tarea
        </button>
      </div>

      {showDetailForm && (
        <NewTaskForm
          projects={projects}
          defaultProjectId={projectId}
          assignees={assignees}
          currentUserId={currentUserId}
          onCreated={refresh}
          onDone={() => setShowDetailForm(false)}
        />
      )}

      {view === "mias" && !currentUserId ? (
        <p className="text-sm text-gray-400">Inicia sesión para ver las tareas asignadas a ti.</p>
      ) : (
        <>
          <p className="mb-3 hidden text-xs text-gray-500 sm:block">
            Arrastra las tarjetas entre columnas, o usa las flechas.
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {COLUMNS.map((column, columnIndex) => {
              const colTasks = boardTasks.filter((t) => t.status === column.status);
              return (
                <div
                  key={column.status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverCol !== column.status) setDragOverCol(column.status);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain") || dragTaskId;
                    if (id) void moveTask(id, column.status);
                    setDragOverCol(null);
                    setDragTaskId(null);
                  }}
                  className={`flex w-72 shrink-0 flex-col rounded-xl border p-2.5 transition-colors ${
                    dragOverCol === column.status
                      ? "border-sky-400/60 bg-sky-500/5"
                      : "border-white/5 bg-white/2"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-300">
                      {column.label}
                    </p>
                    <span className="rounded-full bg-white/10 px-1.5 text-[11px] font-semibold text-gray-400">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="min-h-12 max-h-104 flex-1 space-y-2 overflow-y-auto pr-1">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        columnIndex={columnIndex}
                        dragging={dragTaskId === task.id}
                        assigneeName={resolveName(task.assigneeId) ?? task.assignee}
                        assignees={assignees}
                        currentUserId={currentUserId}
                        projectLabel={view === "mias" ? projectNameOf(task.projectId) : null}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", task.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragTaskId(task.id);
                        }}
                        onDragEnd={() => {
                          setDragTaskId(null);
                          setDragOverCol(null);
                        }}
                        onMove={(direction) => handleMoveByButton(task, direction)}
                        onAssign={(id) => void assignTask(task.id, id)}
                        onDelete={() => setTaskToDelete(task)}
                      />
                    ))}
                    {colTasks.length === 0 && quickAddCol !== column.status && (
                      <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-gray-600">
                        {view === "mias" ? "Nada asignado aquí" : "Suelta una tarjeta aquí"}
                      </p>
                    )}
                  </div>

                  {view === "proyecto" &&
                    canPickAnyProject &&
                    (quickAddCol === column.status ? (
                      <QuickAdd
                        projectId={projectId}
                        status={column.status}
                        onCreated={refresh}
                        onClose={() => setQuickAddCol(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setQuickAddCol(column.status)}
                        className="mt-2 flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      >
                        <Plus className="h-3.5 w-3.5" /> Añadir tarjeta
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Eliminar tarea"
        body={taskToDelete ? `Se eliminará "${taskToDelete.title}".` : undefined}
        onConfirm={() => {
          if (taskToDelete) void removeTask(taskToDelete.id);
        }}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}

/** One board card: project tag (in "Mis tareas"), due-date label, title, description, assignee, move + delete. */
function TaskCard({
  task,
  columnIndex,
  dragging,
  assigneeName,
  assignees,
  currentUserId,
  projectLabel,
  onDragStart,
  onDragEnd,
  onMove,
  onAssign,
  onDelete,
}: {
  task: CrmTask;
  columnIndex: number;
  dragging: boolean;
  assigneeName: string | null;
  assignees: AssignableUser[];
  currentUserId: string;
  projectLabel: string | null;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onMove: (direction: -1 | 1) => void;
  onAssign: (assigneeId: string | null) => void;
  onDelete: () => void;
}) {
  const urgency = task.dueDate ? getDueDateUrgency(task.dueDate) : null;
  const mineAssigned = task.assigneeId === currentUserId && !!currentUserId;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-lg border bg-[#0e1420] p-2.5 shadow-sm transition active:cursor-grabbing ${
        dragging ? "opacity-40" : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        {projectLabel && (
          <span className="max-w-full truncate rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
            {projectLabel}
          </span>
        )}
        {task.dueDate && urgency && (
          <span
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${urgencyBadgeClass(
              urgency
            )}`}
          >
            <Calendar className="h-3 w-3" /> {task.dueDate}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-white">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-400">{task.description}</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {assigneeName && (
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-gray-200"
              title={assigneeName}
            >
              {initials(assigneeName)}
            </span>
          )}
          {assignees.length > 0 ? (
            <select
              value={task.assigneeId ?? ""}
              onChange={(e) => onAssign(e.target.value || null)}
              aria-label="Asignar tarea"
              className="max-w-32 rounded border border-white/10 bg-black/30 px-1 py-0.5 text-[11px] text-gray-300 outline-none focus:border-sky-400/40"
            >
              <option value="">Sin asignar</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.id === currentUserId ? " (yo)" : ""}
                </option>
              ))}
            </select>
          ) : currentUserId ? (
            <button
              type="button"
              onClick={() => onAssign(mineAssigned ? null : currentUserId)}
              className="cursor-pointer rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-gray-300 hover:border-sky-400/40 hover:text-white"
            >
              {mineAssigned ? "Quitarme" : "Asignarme"}
            </button>
          ) : assigneeName ? (
            <span className="truncate text-[11px] text-gray-400">{assigneeName}</span>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar tarea"
            className="cursor-pointer rounded p-1 text-gray-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={columnIndex === 0}
            onClick={() => onMove(-1)}
            aria-label="Mover a la columna anterior"
            className="cursor-pointer rounded p-1 text-gray-500 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={columnIndex === COLUMNS.length - 1}
            onClick={() => onMove(1)}
            aria-label="Mover a la siguiente columna"
            className="cursor-pointer rounded p-1 text-gray-500 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Trello-style bottom-of-column composer: just a title, Enter to add, stays open for the next. */
function QuickAdd({
  projectId,
  status,
  onCreated,
  onClose,
}: {
  projectId: string;
  status: TaskStatus;
  onCreated: () => Promise<void>;
  onClose: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [state, formAction, pending] = useActionState<CrmActionState, FormData>(
    async (prevState, formData) => {
      const result = await createTaskAction(prevState, formData);
      if (result && "success" in result) {
        await onCreated();
        if (taRef.current) {
          taRef.current.value = "";
          taRef.current.focus();
        }
      }
      return result;
    },
    null
  );

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="status" value={status} />
      <textarea
        ref={taRef}
        name="title"
        required
        rows={2}
        placeholder="Título de la tarjeta…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
      />
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-60"
        >
          Añadir tarjeta
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="cursor-pointer rounded p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/**
 * Inline form for `createTaskAction`: pick the project and assignee (defaults
 * to the signed-in user), plus optional due date and description. Refetches
 * the task list and collapses itself on success.
 */
function NewTaskForm({
  projects,
  defaultProjectId,
  assignees,
  currentUserId,
  onCreated,
  onDone,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId: string;
  assignees: AssignableUser[];
  currentUserId: string;
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

  const fieldClass =
    "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

  return (
    <form action={formAction} className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="title" required placeholder="Título de la tarea" className={`${fieldClass} sm:col-span-2`} />

        <select name="projectId" defaultValue={defaultProjectId} className={fieldClass}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {assignees.length > 0 ? (
          <select name="assigneeId" defaultValue={currentUserId || ""} className={fieldClass}>
            <option value="">Sin asignar</option>
            {assignees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.id === currentUserId ? " (yo)" : ""}
              </option>
            ))}
          </select>
        ) : (
          <input name="assignee" placeholder="Asignado a (opcional)" className={fieldClass} />
        )}

        <input name="dueDate" type="date" className={fieldClass} />
        <input name="description" placeholder="Descripción (opcional)" className={`${fieldClass} sm:col-span-2`} />
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
