"use server";

/**
 * CRM contacts: the people inside a client company. `crm_clients` stays the
 * account/company entity; each account has one or more `crm_contacts`, exactly
 * one of which is `is_primary` and mirrored onto `crm_clients.name/email/phone`
 * so the existing client list, overview KPIs and PDFs keep working off that
 * snapshot. Every mutation requires `requireCrmCore()` (dios, admin, ejecutivo)
 * and logs to the client history via `addHistory`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmCore } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory } from "./history";
import type { CrmActionState } from "./clients";

export type CrmContact = {
  id: string;
  clientId: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** Free-text job title / role inside the company ("Gerente IT", "Administración"…). */
  role: string | null;
  isPrimary: boolean;
  notes: string | null;
  createdAt: string;
};

/**
 * Converts a raw `crm_contacts` row (snake_case) into a `CrmContact`. Not
 * exported: a "use server" file may only export async functions — callers get
 * mapped rows through `getContactsByClient` instead.
 */
function mapContact(row: {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
}): CrmContact {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isPrimary: row.is_primary,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/** Fetches a client's live contacts, primary first, then oldest to newest. */
export async function getContactsByClient(clientId: string): Promise<CrmContact[]> {
  return withTiming("crm.getContactsByClient", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    return (data ?? []).map(mapContact);
  });
}

/**
 * Copies the current primary contact's name/email/phone onto the parent
 * `crm_clients` row so list/summary/PDF code that reads that snapshot stays in
 * sync. No-op if the client has no primary contact.
 */
async function syncPrimarySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string
) {
  const { data: primary } = await supabase
    .from("crm_contacts")
    .select("name, email, phone")
    .eq("client_id", clientId)
    .eq("is_primary", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (primary) {
    await supabase
      .from("crm_clients")
      .update({ name: primary.name, email: primary.email, phone: primary.phone })
      .eq("id", clientId);
  }
}

/** `useActionState` action backing the "Nuevo contacto" form in the client modal. */
export async function createContactAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const makePrimary = formData.get("isPrimary") === "on";

  if (!clientId || !name) {
    return { error: "Escribe al menos el nombre del contacto" };
  }

  const supabase = await createClient();

  // The client's first live contact is always primary, regardless of the checkbox.
  const { count } = await supabase
    .from("crm_contacts")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .is("deleted_at", null);
  const isPrimary = makePrimary || (count ?? 0) === 0;

  if (isPrimary) {
    await supabase
      .from("crm_contacts")
      .update({ is_primary: false })
      .eq("client_id", clientId)
      .eq("is_primary", true);
  }

  const { error } = await supabase.from("crm_contacts").insert({
    client_id: clientId,
    name,
    email: email || null,
    phone: phone || null,
    role: role || null,
    is_primary: isPrimary,
    created_by: check.userId,
  });

  if (error) return { error: error.message };

  if (isPrimary) await syncPrimarySnapshot(supabase, clientId);
  await addHistory(
    supabase,
    clientId,
    "nota",
    `Contacto agregado: ${name}${role ? ` (${role})` : ""}`,
    check.userId
  );
  revalidatePath("/admin");
  return { success: true };
}

/** `useActionState` action backing the inline "edit contact" form. */
export async function updateContactAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const contactId = String(formData.get("contactId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();

  if (!contactId || !clientId || !name) {
    return { error: "El nombre del contacto es obligatorio" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("crm_contacts")
    .update({ name, email: email || null, phone: phone || null, role: role || null })
    .eq("id", contactId);

  if (error) return { error: error.message };

  await syncPrimarySnapshot(supabase, clientId);
  revalidatePath("/admin");
  return { success: true };
}

/** Makes `contactId` the client's primary contact; clears the flag on the rest. */
export async function setPrimaryContactAction(
  contactId: string,
  clientId: string
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  await supabase
    .from("crm_contacts")
    .update({ is_primary: false })
    .eq("client_id", clientId)
    .eq("is_primary", true);

  const { error } = await supabase
    .from("crm_contacts")
    .update({ is_primary: true })
    .eq("id", contactId);

  if (error) return { error: error.message };

  await syncPrimarySnapshot(supabase, clientId);
  await addHistory(supabase, clientId, "nota", "Cambio de contacto principal", check.userId);
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Soft-deletes a contact (recoverable; logged to `deletion_log`). Refuses to
 * remove the primary contact while other live contacts exist — reassign first.
 */
export async function deleteContactAction(
  contactId: string,
  clientId: string
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("is_primary, name")
    .eq("id", contactId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!contact) return { error: "El contacto ya no existe" };

  if (contact.is_primary) {
    const { count } = await supabase
      .from("crm_contacts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .is("deleted_at", null)
      .neq("id", contactId);
    if ((count ?? 0) > 0) {
      return { error: "Marca otro contacto como principal antes de eliminar este" };
    }
  }

  const result = await softDelete({
    table: "crm_contacts",
    id: contactId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  await addHistory(supabase, clientId, "nota", `Contacto eliminado: ${contact.name}`, check.userId);
  revalidatePath("/admin");
  return { success: true };
}
