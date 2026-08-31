"use server";

/**
 * CRM tasks: data fetching plus server actions for creating tasks and
 * moving them across the kanban-style status columns in `TasksSection`.
 * Tasks belong to a project and are not logged to client history. Every
 * mutation requires `requireDashboard()` (any signed-in role).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireDashboard } from "./auth";
import { softDelete } from "./soft-delete";
import type { CrmActionState } from "./clients";

export type TaskStatus = "por_hacer" | "en_progreso" | "terminado";

const TASK_STATUSES: TaskStatus[] = ["por_hacer", "en_progreso", "terminado"];

export type CrmTask = {
  id: string;
  /** Null for standalone tasks that don't hang off a project. */
  projectId: string | null;
  /** Optional client the task relates to (standalone or project tasks alike). */
  clientId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Free-text assignee (legacy rows / notes). Prefer `assigneeId`. */
  assignee: string | null;
  /** `auth.users` id of the assigned account, or null. */
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
};

/** Converts a raw `crm_tasks` row (snake_case) into a `CrmTask`. */
function mapTask(row: {
  id: string;
  project_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string;
  assignee: string | null;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
}): CrmTask {
  return {
    id: row.id,
    projectId: row.project_id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    assignee: row.assignee,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

/** Fetches every task across all projects, oldest first. */
export async function getAllTasks(): Promise<CrmTask[]> {
  return withTiming("crm.getAllTasks", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_tasks").select("*").is("deleted_at", null).order("created_at", { ascending: true });
    return (data ?? []).map(mapTask);
  });
}

/** `useActionState` action backing the "Nueva tarea" form. */
export async function createTaskAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireDashboard();
  if (!check.ok) return { error: check.error };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignee = String(formData.get("assignee") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  // Optional: the board's quick-add composer creates a card straight into the
  // column it was opened from. Anything unrecognised falls back to the DB default.
  const status = TASK_STATUSES.includes(statusRaw as TaskStatus)
    ? (statusRaw as TaskStatus)
    : undefined;

  if (!title) {
    return { error: "Escribe el título de la tarea" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_tasks").insert({
    project_id: projectId || null,
    client_id: clientId || null,
    title,
    description: description || null,
    assignee: assignee || null,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
    ...(status ? { status } : {}),
    created_by: check.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Moves a task to a new kanban column (status). */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<CrmActionState> {
  const check = await requireDashboard();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_tasks").update({ status }).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Assigns a task to a CRM account, or clears the assignment when
 * `assigneeId` is null. Also clears the legacy free-text `assignee` so the
 * two never disagree.
 */
export async function updateTaskAssigneeAction(
  taskId: string,
  assigneeId: string | null
): Promise<CrmActionState> {
  const check = await requireDashboard();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_tasks")
    .update({ assignee_id: assigneeId, assignee: null })
    .eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Soft-deletes a task (recoverable; logged to `deletion_log`). RLS further
 * limits this to dios/admin/blog or the task's creator.
 */
export async function deleteTaskAction(taskId: string): Promise<CrmActionState> {
  const check = await requireDashboard();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_tasks",
    id: taskId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin");
  return { success: true };
}
