"use server";

/**
 * CRM tasks: data fetching plus server actions for creating tasks and
 * moving them across the kanban-style status columns in `TasksSection`.
 * Tasks belong to a project and are not logged to client history. Every
 * mutation requires `requireCrmAccess()`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmAccess } from "./auth";
import type { CrmActionState } from "./clients";

export type TaskStatus = "por_hacer" | "en_progreso" | "terminado";

export type CrmTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string | null;
  dueDate: string | null;
  createdAt: string;
};

/** Converts a raw `crm_tasks` row (snake_case) into a `CrmTask`. */
function mapTask(row: {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
}): CrmTask {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    assignee: row.assignee,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

/** Fetches every task across all projects, oldest first. */
export async function getAllTasks(): Promise<CrmTask[]> {
  return withTiming("crm.getAllTasks", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_tasks").select("*").order("created_at", { ascending: true });
    return (data ?? []).map(mapTask);
  });
}

/** `useActionState` action backing the "Nueva tarea" form. */
export async function createTaskAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignee = String(formData.get("assignee") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!projectId || !title) {
    return { error: "Selecciona un proyecto y escribe el título de la tarea" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_tasks").insert({
    project_id: projectId,
    title,
    description: description || null,
    assignee: assignee || null,
    due_date: dueDate || null,
    created_by: check.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Moves a task to a new kanban column (status). */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_tasks").update({ status }).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
