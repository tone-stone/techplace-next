"use client";

/**
 * "Contactos" panel inside `ClientWorkspace`: lists the people at a client
 * company, with an inline add form, per-row edit, "hacer principal", and
 * soft-delete. The primary contact's name/email/phone is mirrored onto the
 * `crm_clients` row server-side (see `src/lib/crm/contacts.ts`), so the client
 * list and PDFs keep working off that snapshot.
 */

import { useActionState, useState } from "react";
import { CheckCircle2, Mail, Phone, Plus, Trash2, User, X } from "lucide-react";
import {
  createContactAction,
  deleteContactAction,
  setPrimaryContactAction,
  updateContactAction,
  type CrmContact,
} from "@/lib/crm/contacts";
import type { CrmActionState } from "@/lib/crm/clients";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** Lists a client's contacts with add / edit / set-primary / delete controls. */
export default function ContactsPanel({
  clientId,
  contacts,
  onChanged,
}: {
  clientId: string;
  contacts: CrmContact[];
  onChanged: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CrmContact | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addState, addAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await createContactAction(prev, formData);
    if (result && "success" in result) {
      setShowAdd(false);
      onChanged();
    }
    return result;
  }, null);

  const handleSetPrimary = async (id: string) => {
    setBusyId(id);
    setRowError(null);
    const result = await setPrimaryContactAction(id, clientId);
    setBusyId(null);
    if (result && "error" in result) setRowError(result.error);
    else onChanged();
  };

  const handleDelete = async (id: string) => {
    setRowError(null);
    const result = await deleteContactAction(id, clientId);
    if (result && "error" in result) setRowError(result.error);
    else onChanged();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-300">
          <User className="h-4 w-4 text-sky-300" /> Contactos
        </h3>
        <button
          type="button"
          onClick={() => setShowAdd((o) => !o)}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo contacto
        </button>
      </div>

      {showAdd && (
        <form action={addAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid grid-cols-2 gap-2">
            <input name="name" required placeholder="Nombre" className={`col-span-2 ${FIELD}`} />
            <input name="role" placeholder="Puesto (Gerente IT, Administración…)" className={`col-span-2 ${FIELD}`} />
            <input name="email" type="email" placeholder="Email" className={FIELD} />
            <input name="phone" placeholder="Teléfono" className={FIELD} />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input name="isPrimary" type="checkbox" className="h-4 w-4" /> Marcar como contacto principal
          </label>
          {addState && "error" in addState && <p className="text-xs text-red-400">{addState.error}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-sky-500/20 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            Guardar contacto
          </button>
        </form>
      )}

      {rowError && <p className="mb-2 text-xs text-red-400">{rowError}</p>}

      {contacts.length === 0 ? (
        <p className="text-sm text-gray-500">Este cliente no tiene contactos registrados.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) =>
            editingId === contact.id ? (
              <EditContactForm
                key={contact.id}
                clientId={clientId}
                contact={contact}
                onDone={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  onChanged();
                }}
              />
            ) : (
              <div
                key={contact.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{contact.name}</p>
                    {contact.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Principal
                      </span>
                    )}
                    {contact.role && <span className="text-xs text-gray-400">· {contact.role}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!contact.isPrimary && (
                    <button
                      type="button"
                      disabled={busyId === contact.id}
                      onClick={() => handleSetPrimary(contact.id)}
                      className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-300 hover:border-emerald-400/40 hover:text-emerald-300 disabled:opacity-50"
                    >
                      Hacer principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(contact.id)}
                    className="cursor-pointer rounded-full border border-white/10 px-2.5 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(contact)}
                    aria-label={`Eliminar contacto ${contact.name}`}
                    className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar contacto"
        body={toDelete ? `Se eliminará ${toDelete.name}.` : undefined}
        onConfirm={() => {
          if (toDelete) void handleDelete(toDelete.id);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/** Inline per-row edit form backed by `updateContactAction`. */
function EditContactForm({
  clientId,
  contact,
  onDone,
  onSaved,
}: {
  clientId: string;
  contact: CrmContact;
  onDone: () => void;
  onSaved: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await updateContactAction(prev, formData);
    if (result && "success" in result) onSaved();
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-sky-400/30 bg-white/5 p-3">
      <input type="hidden" name="contactId" value={contact.id} />
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid grid-cols-2 gap-2">
        <input name="name" required defaultValue={contact.name} placeholder="Nombre" className={`col-span-2 ${FIELD}`} />
        <input name="role" defaultValue={contact.role ?? ""} placeholder="Puesto" className={`col-span-2 ${FIELD}`} />
        <input name="email" type="email" defaultValue={contact.email ?? ""} placeholder="Email" className={FIELD} />
        <input name="phone" defaultValue={contact.phone ?? ""} placeholder="Teléfono" className={FIELD} />
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300 hover:border-white/20"
        >
          <X className="h-3.5 w-3.5" /> Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
