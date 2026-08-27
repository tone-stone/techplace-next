"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmAccess } from "./auth";
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

export async function getProjects(): Promise<CrmProject[]> {
  return withTiming("crm.getProjects", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_projects").select("*").order("created_at", { ascending: false });
    return (data ?? []).map(mapProject);
  });
}

export async function getProjectDetail(projectId: string): Promise<CrmProject | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("crm_projects").select("*").eq("id", projectId).single();
  return data ? mapProject(data) : null;
}

export async function createProjectAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
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

export async function updateProjectStatusAction(
  projectId: string,
  clientId: string,
  status: ProjectStatus
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_projects").update({ status }).eq("id", projectId);
  if (error) return { error: error.message };

  await addHistory(supabase, clientId, "proyecto", `Proyecto actualizado a "${status}"`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}

export async function updateProjectProgressAction(
  projectId: string,
  progress: number
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_projects").update({ progress }).eq("id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
