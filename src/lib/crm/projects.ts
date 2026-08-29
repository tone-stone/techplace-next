"use server";

/**
 * CRM projects: data fetching plus server actions for creating projects and
 * updating their status/progress. Projects are the parent entity for tasks
 * (see tasks.ts) and can be linked to an invoice. Every mutation requires
 * `requireCrmCore()` (dios, admin, ejecutivo).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmCore } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory } from "./history";
import type { CrmActionState } from "./clients";

export type ProjectStatus = "planeacion" | "en_progreso" | "revision" | "completado";

export type CrmProject = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  budget: number;
  dueDate: string | null;
  createdAt: string;
};

/** Converts a raw `crm_projects` row (snake_case) into a `CrmProject`. */
function mapProject(row: {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number;
  due_date: string | null;
  created_at: string;
}): CrmProject {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    status: row.status as ProjectStatus,
    progress: row.progress,
    budget: Number(row.budget),
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

/** Fetches every project, most recently created first. */
export async function getProjects(): Promise<CrmProject[]> {
  return withTiming("crm.getProjects", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_projects").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    return (data ?? []).map(mapProject);
  });
}

/**
 * `{ id, name }` for every project, via a SECURITY DEFINER RPC so roles
 * without the Proyectos module (blog, redactor) can still label tasks by
 * project in the Tareas module without exposing budgets or the rest.
 */
export async function getProjectNames(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("crm_project_names");
  return (data ?? []) as { id: string; name: string }[];
}

/** Fetches a single project by id, used to refresh `ProjectDetailModal`. */
export async function getProjectDetail(projectId: string): Promise<CrmProject | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("crm_projects").select("*").eq("id", projectId).single();
  return data ? mapProject(data) : null;
}

/** `useActionState` action backing the "Nuevo proyecto" form. */
export async function createProjectAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const budget = Number(formData.get("budget") ?? 0);
  const dueDate = String(formData.get("dueDate") ?? "").trim();

  if (!clientId || !name) {
    return { error: "Selecciona un cliente y escribe el nombre del proyecto" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("crm_projects").insert({
    client_id: clientId,
    name,
    description: description || null,
    budget,
    due_date: dueDate || null,
    created_by: check.userId,
  });

  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "proyecto", `Proyecto "${name}" creado`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** Updates a project's status and logs the change to the client's history. */
export async function updateProjectStatusAction(
  projectId: string,
  clientId: string,
  status: ProjectStatus
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_projects").update({ status }).eq("id", projectId);
  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "proyecto", `Proyecto actualizado a "${status}"`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/** Updates a project's completion percentage (from the detail modal's slider); not logged to history. */
export async function updateProjectProgressAction(
  projectId: string,
  progress: number
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_projects").update({ progress }).eq("id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

/** Soft-deletes a project (recoverable; logged to `deletion_log`). */
export async function deleteProjectAction(projectId: string, clientId?: string): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_projects",
    id: projectId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  if (clientId) {
    const supabase = await createClient();
    await addHistory(supabase, clientId, "proyecto", "Proyecto eliminado", check.userId);
  }
  revalidatePath("/admin");
  return { success: true };
}
