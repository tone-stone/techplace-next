"use client";

/**
 * Shared create/edit form for a CRM client. Renders `createClientAction`
 * when no `client` is passed and `updateClientAction` (with a hidden
 * `clientId`) when editing an existing one. Only name + company are required;
 * every other field is optional and can be filled in later by editing.
 * Calls `onDone` on success so the caller can collapse the form and/or refetch.
 */

import { useActionState } from "react";
import {
  createClientAction,
  updateClientAction,
  type ClientProfile,
  type CrmActionState,
  type CrmClient,
} from "@/lib/crm/clients";

const SOURCE_OPTIONS = [
  "Referido",
  "Google",
  "Redes sociales",
  "Sitio web",
  "Evento",
  "Publicidad",
  "Cliente anterior",
  "Llamada en frío",
];
const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"];

const FIELD =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** Uppercase group label between form sections. */
function GroupLabel({ children }: { children: string }) {
  return (
    <p className="col-span-1 mt-1 text-xs font-bold uppercase tracking-wide text-gray-400 sm:col-span-2">
      {children}
    </p>
  );
}

/** Inline form for creating or editing a client; `client` present ⇒ edit mode. */
export default function ClientForm({
  client,
  profile,
  serviceOptions = [],
  onDone,
}: {
  client?: CrmClient;
  /** Current values of the optional profile fields, when editing. */
  profile?: ClientProfile | null;
  /** Names from the service catalog — suggested in the "Servicio" field, which stays free-text. */
  serviceOptions?: string[];
  onDone: () => void;
}) {
  const isEdit = Boolean(client);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = isEdit
      ? await updateClientAction(prevState, formData)
      : await createClientAction(prevState, formData);
    if (result && "success" in result) onDone();
    return result;
  }, null);

  return (
    <form action={formAction} className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
      {client && <input type="hidden" name="clientId" value={client.id} />}

      {serviceOptions.length > 0 && (
        <datalist id="client-service-options">
          {serviceOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      )}
      <datalist id="client-source-options">
        {SOURCE_OPTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="client-size-options">
        {SIZE_OPTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <GroupLabel>Contacto</GroupLabel>
        <input name="name" required defaultValue={client?.name ?? ""} placeholder="Nombre del contacto *" className={FIELD} />
        <input
          name="jobTitle"
          defaultValue={profile?.jobTitle ?? ""}
          placeholder="Puesto"
          className={FIELD}
        />
        <input name="email" type="email" defaultValue={client?.email ?? ""} placeholder="Email" className={FIELD} />
        <input name="phone" defaultValue={client?.phone ?? ""} placeholder="Teléfono" className={FIELD} />
        <input
          name="whatsapp"
          defaultValue={profile?.whatsapp ?? ""}
          placeholder="WhatsApp"
          className={`${FIELD} sm:col-span-2`}
        />

        <GroupLabel>Empresa</GroupLabel>
        <input name="company" required defaultValue={client?.company ?? ""} placeholder="Empresa *" className={FIELD} />
        <input
          name="industry"
          defaultValue={profile?.industry ?? ""}
          placeholder="Giro / Industria"
          className={FIELD}
        />
        <input
          name="companySize"
          list="client-size-options"
          defaultValue={profile?.companySize ?? ""}
          placeholder="Tamaño de la empresa"
          className={FIELD}
        />
        <input name="city" defaultValue={profile?.city ?? ""} placeholder="Ciudad" className={FIELD} />
        <input
          name="address"
          defaultValue={profile?.address ?? ""}
          placeholder="Dirección (referencia, no fiscal)"
          className={`${FIELD} sm:col-span-2`}
        />

        <GroupLabel>Comercial</GroupLabel>
        <input
          name="service"
          list="client-service-options"
          defaultValue={client?.service ?? ""}
          placeholder="Servicio — elige de la lista o escribe"
          className={FIELD}
        />
        <input
          name="source"
          list="client-source-options"
          defaultValue={profile?.source ?? ""}
          placeholder="¿Cómo nos encontró?"
          className={FIELD}
        />
        <textarea
          name="notes"
          defaultValue={client?.notes ?? ""}
          placeholder="Notas internas"
          rows={3}
          className={`${FIELD} col-span-1 resize-y sm:col-span-2`}
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
          {isEdit ? "Guardar cambios" : "Guardar cliente"}
        </button>
      </div>
    </form>
  );
}
