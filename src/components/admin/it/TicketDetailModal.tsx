"use client";

/**
 * Full-screen modal for one support ticket: status / priority / assignee
 * controls, the client-visible + internal message thread with a reply box,
 * and the immutable event log. Fetches `getTicketDetail` on mount and
 * refetches after every mutation.
 */

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, Clock, Loader2, MessageSquare, Trash2, X } from "lucide-react";
import {
  addTicketMessageAction,
  assignTicketAction,
  deleteTicketAction,
  getTicketDetail,
  updateTicketPriorityAction,
  updateTicketStatusAction,
} from "@/lib/it/tickets";
import { addTimeEntryAction, deleteTimeEntryAction } from "@/lib/it/time-entries";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  formatMinutes,
  type TicketDetail,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/it/ticket-types";
import type { CrmActionState } from "@/lib/crm/clients";
import type { AssignableUser } from "@/lib/auth/users";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ModalPortal from "@/components/admin/crm/ModalPortal";

type Picker = { id: string; name: string; clientId?: string };

/** True when an open ticket has blown past its SLA target. `new Date()` lives
 *  inside the helper so it isn't an impure call in component render. */
function isSlaBreached(slaDueAt: string | null, status: TicketStatus): boolean {
  if (!slaDueAt || status === "resuelto" || status === "cerrado") return false;
  return new Date(slaDueAt).getTime() < Date.now();
}

const CONTROL =
  "rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400/40";

export default function TicketDetailModal({
  ticketId,
  clients,
  assignees,
  contacts,
  assets,
  onClose,
}: {
  ticketId: string;
  clients: Picker[];
  assignees: AssignableUser[];
  contacts: Picker[];
  assets: Picker[];
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const data = await getTicketDetail(ticketId);
    setDetail(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nameOf = (list: Picker[], id: string | null) =>
    id ? (list.find((x) => x.id === id)?.name ?? "—") : "—";
  const assigneeName = (id: string | null) =>
    id ? (assignees.find((u) => u.id === id)?.name ?? "—") : "sin asignar";

  const run = async (fn: () => Promise<CrmActionState>) => {
    setBusy(true);
    await fn();
    setBusy(false);
    await refresh();
  };

  const t = detail?.ticket;
  const slaBreached = t ? isSlaBreached(t.slaDueAt, t.status) : false;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className="tp-dark-card-crm relative my-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute right-4 top-4 flex items-center gap-1">
            {detail && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Eliminar ticket"
                className="-m-1 cursor-pointer rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-m-1 cursor-pointer rounded-full p-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading || !detail || !t ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Cargando ticket…
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-xs text-gray-500">{t.number}</p>
                <h2 className="text-xl font-bold text-white">{t.subject}</h2>
                {t.description && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-400">{t.description}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1 text-[11px] text-gray-400">
                  Estado
                  <select
                    value={t.status}
                    disabled={busy}
                    onChange={(e) => run(() => updateTicketStatusAction(t.id, e.target.value as TicketStatus))}
                    className={CONTROL}
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 text-[11px] text-gray-400">
                  Prioridad
                  <select
                    value={t.priority}
                    disabled={busy}
                    onChange={(e) => run(() => updateTicketPriorityAction(t.id, e.target.value as TicketPriority))}
                    className={CONTROL}
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 text-[11px] text-gray-400">
                  Asignado
                  <select
                    value={t.assigneeId ?? ""}
                    disabled={busy}
                    onChange={(e) => run(() => assignTicketAction(t.id, e.target.value || null))}
                    className={CONTROL}
                  >
                    <option value="">Sin asignar</option>
                    {assignees.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-white/5 bg-white/2 p-3 text-xs text-gray-400">
                <span>Cliente: <span className="text-gray-200">{nameOf(clients, t.clientId)}</span></span>
                <span>Contacto: <span className="text-gray-200">{nameOf(contacts, t.contactId)}</span></span>
                <span>Activo: <span className="text-gray-200">{nameOf(assets, t.assetId)}</span></span>
                <span>Asignado: <span className="text-gray-200">{assigneeName(t.assigneeId)}</span></span>
                <span className="col-span-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  SLA:{" "}
                  <span className={slaBreached ? "font-semibold text-red-400" : "text-gray-200"}>
                    {t.slaDueAt ? new Date(t.slaDueAt).toLocaleString("es-MX") : "—"}
                  </span>
                  {slaBreached && <AlertTriangle className="h-3 w-3 text-red-400" />}
                </span>
              </div>

              <TimePanel
                ticketId={t.id}
                entries={detail.timeEntries}
                assignees={assignees}
                onChanged={refresh}
              />

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-300">
                  <MessageSquare className="h-4 w-4 text-sky-300" /> Conversación
                </h3>
                <ReplyBox ticketId={t.id} onSent={refresh} />
                <div className="mt-4 space-y-2">
                  {detail.messages.length === 0 && (
                    <p className="text-sm text-gray-500">Sin mensajes todavía.</p>
                  )}
                  {detail.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 ${
                        m.isInternal
                          ? "border-amber-400/20 bg-amber-500/5"
                          : "border-white/5 bg-white/2"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            m.isInternal
                              ? "border-amber-400/30 text-amber-300"
                              : "border-white/10 text-gray-300"
                          }`}
                        >
                          {m.isInternal ? "Nota interna" : "Cliente"}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(m.createdAt).toLocaleString("es-MX")}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-200">{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-300">Bitácora</h3>
                <div className="space-y-1.5">
                  {detail.events.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-[11px] text-gray-600">
                        {new Date(e.createdAt).toLocaleString("es-MX")}
                      </span>
                      <span className="text-gray-300">{e.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={confirmDelete}
          title="Eliminar ticket"
          body={t ? `Se eliminará el ticket ${t.number}.` : undefined}
          onConfirm={async () => {
            await deleteTicketAction(ticketId);
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      </div>
    </ModalPortal>
  );
}

/** Reply composer with an "internal note" toggle. */
function ReplyBox({ ticketId, onSent }: { ticketId: string; onSent: () => void }) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await addTicketMessageAction(prev, formData);
    if (result && "success" in result) {
      setFormKey((k) => k + 1);
      onSent();
    }
    return result;
  }, null);

  return (
    <form key={formKey} action={formAction} className="space-y-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Escribe una respuesta…"
        className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
      />
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input name="isInternal" type="checkbox" className="h-4 w-4" /> Nota interna (no se envía al cliente)
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Enviar
        </button>
      </div>
    </form>
  );
}

/** Logged-time list + "registrar tiempo" composer. */
function TimePanel({
  ticketId,
  entries,
  assignees,
  onChanged,
}: {
  ticketId: string;
  entries: TicketDetail["timeEntries"];
  assignees: AssignableUser[];
  onChanged: () => void;
}) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, formData) => {
    const result = await addTimeEntryAction(prev, formData);
    if (result && "success" in result) {
      setFormKey((k) => k + 1);
      onChanged();
    }
    return result;
  }, null);

  const total = entries.reduce((s, e) => s + e.minutes, 0);
  const billable = entries.filter((e) => e.billable).reduce((s, e) => s + e.minutes, 0);
  const who = (id: string | null) => (id ? (assignees.find((u) => u.id === id)?.name ?? "—") : "—");

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-300">
        <Clock className="h-4 w-4 text-sky-300" /> Tiempo · {formatMinutes(total)}
        {billable !== total && <span className="text-[11px] font-normal text-gray-500">({formatMinutes(billable)} facturable)</span>}
      </h3>

      <form key={formKey} action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="ticketId" value={ticketId} />
        <input
          name="hours"
          type="number"
          min="0"
          step="0.25"
          required
          placeholder="Horas"
          className="w-20 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
          aria-label="Horas"
        />
        <input
          name="workedOn"
          type="date"
          className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
          aria-label="Fecha"
        />
        <input
          name="description"
          placeholder="Qué se hizo"
          className="min-w-32 flex-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <label className="flex items-center gap-1 text-[11px] text-gray-400">
          <input name="billable" type="checkbox" defaultChecked className="h-3.5 w-3.5" /> Facturable
        </label>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Registrar
        </button>
        {state && "error" in state && <p className="w-full text-xs text-red-400">{state.error}</p>}
      </form>

      <div className="mt-3 space-y-1.5">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-300">
              <span className="font-semibold text-white">{formatMinutes(e.minutes)}</span> · {e.workedOn} · {who(e.userId)}
              {e.description ? ` — ${e.description}` : ""}
              {!e.billable && <span className="ml-1 text-gray-500">(no facturable)</span>}
            </span>
            <button
              type="button"
              onClick={async () => {
                await deleteTimeEntryAction(e.id);
                onChanged();
              }}
              aria-label="Eliminar registro de tiempo"
              className="cursor-pointer rounded-full p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
