"use client";

/**
 * Full-screen modal (via `ModalPortal`) showing a single client's profile:
 * billing plans, payments, and activity history, each with its own inline
 * add-form. Fetches the client's detail on mount/`clientId` change and
 * refetches after every mutation so the modal always reflects the latest
 * server state.
 */

import { useActionState, useEffect, useState } from "react";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Receipt,
  X,
} from "lucide-react";
import {
  addHistoryEntryAction,
  createPlanAction,
  getClientDetail,
  markPaymentPaidAction,
  recordPaymentAction,
  type ClientDetail,
  type CrmActionState,
} from "@/lib/crm/clients";
import { formatCurrencyMXN } from "@/lib/crm/format";
import { getDueDateUrgency } from "@/lib/crm/plan-status";
import StatusBadge from "./StatusBadge";
import ModalPortal from "./ModalPortal";

const HISTORY_LABELS: Record<string, string> = {
  nota: "Nota",
  llamada: "Llamada",
  reunion: "Reunión",
  email: "Email",
  pago: "Pago",
  plan: "Plan",
  cambio_estado: "Cambio de estado",
  otro: "Otro",
};

/** Badge color class for a due-date urgency (shared by plans and payments panels). */
function urgencyBadgeClass(urgency: ReturnType<typeof getDueDateUrgency>) {
  if (urgency === "vencido") return "border-red-400/30 bg-red-500/10 text-red-300";
  if (urgency === "por_vencer") return "border-amber-400/30 bg-amber-500/10 text-amber-300";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
}

/** Spanish label for a due-date urgency. */
function urgencyLabel(urgency: ReturnType<typeof getDueDateUrgency>) {
  if (urgency === "vencido") return "Vencido";
  if (urgency === "por_vencer") return "Por vencer";
  return "Al día";
}

/** Portaled modal shell: loads the client's detail and shows a spinner until it's ready. */
export default function ClientDetailModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const data = await getClientDetail(clientId);
    setDetail(data);
    setLoading(false);
  };

  useEffect(() => {
    // Fetching on mount / when the selected client changes — a valid effect
    // use case, not a derived-state update in response to a render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 -m-2 cursor-pointer rounded-full p-2 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {loading || !detail ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando cliente…
          </div>
        ) : (
          <ClientDetailContent detail={detail} onChanged={refresh} />
        )}
      </div>
    </div>
    </ModalPortal>
  );
}

/** Modal body once the client detail has loaded: header info plus the plans/payments/history panels. */
function ClientDetailContent({ detail, onChanged }: { detail: ClientDetail; onChanged: () => void }) {
  const { client, history, plans, payments } = detail;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-white">{client.company}</h2>
          <StatusBadge status={client.status} />
        </div>
        <p className="text-sm text-gray-400">{client.name}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {client.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> {client.email}
            </span>
          )}
          {client.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {client.phone}
            </span>
          )}
        </div>
      </div>

      <PlansPanel clientId={client.id} plans={plans} onChanged={onChanged} />
      <PaymentsPanel clientId={client.id} plans={plans} payments={payments} onChanged={onChanged} />
      <HistoryPanel clientId={client.id} history={history} onChanged={onChanged} />
    </div>
  );
}

/** Small icon + uppercase title heading shared by the panels below. */
function SectionHeading({ icon: Icon, title }: { icon: typeof Calendar; title: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-300">
      <Icon className="h-4 w-4 text-sky-300" /> {title}
    </h3>
  );
}

/** Lists a client's billing plans with urgency badges and an inline "new plan" form. */
function PlansPanel({
  clientId,
  plans,
  onChanged,
}: {
  clientId: string;
  plans: ClientDetail["plans"];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await createPlanAction(prevState, formData);
    if (result && "success" in result) {
      setOpen(false);
      onChanged();
    }
    return result;
  }, null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading icon={CalendarClock} title="Planes" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo plan
        </button>
      </div>

      {open && (
        <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="name"
              required
              placeholder="Nombre del plan"
              className="col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
            />
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Monto MXN"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
            />
            <select
              name="billingCycle"
              defaultValue="mensual"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            >
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
            <label className="text-xs text-gray-400">
              Día de corte
              <input
                name="cutoffDay"
                type="number"
                min="1"
                max="31"
                required
                defaultValue={1}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
              />
            </label>
            <label className="text-xs text-gray-400">
              Próximo vencimiento
              <input
                name="nextDueDate"
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
              />
            </label>
          </div>
          {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-sky-500/20 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            Guardar plan
          </button>
        </form>
      )}

      {plans.length === 0 ? (
        <p className="text-sm text-gray-500">Este cliente no tiene planes registrados.</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const urgency = getDueDateUrgency(plan.nextDueDate);
            return (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">{plan.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyMXN(plan.amount)} / {plan.billingCycle} · corte día {plan.cutoffDay}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(urgency)}`}>
                  {urgencyLabel(urgency)} · vence {plan.nextDueDate}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Lists a client's payments with an inline "new payment" form and a
 * one-click "mark as paid" action for pending/overdue entries.
 */
function PaymentsPanel({
  clientId,
  plans,
  payments,
  onChanged,
}: {
  clientId: string;
  plans: ClientDetail["plans"];
  payments: ClientDetail["payments"];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await recordPaymentAction(prevState, formData);
    if (result && "success" in result) {
      setOpen(false);
      onChanged();
    }
    return result;
  }, null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleMarkPaid = async (paymentId: string) => {
    setMarkingId(paymentId);
    await markPaymentPaidAction(paymentId, clientId);
    setMarkingId(null);
    onChanged();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading icon={Receipt} title="Pagos" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo pago
        </button>
      </div>

      {open && (
        <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <input type="hidden" name="clientId" value={clientId} />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="Monto MXN"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
            />
            <input
              name="dueDate"
              type="date"
              required
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            />
            {plans.length > 0 && (
              <select
                name="planId"
                defaultValue=""
                className="col-span-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
              >
                <option value="">Sin plan asociado</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            )}
            <input
              name="method"
              placeholder="Método (transferencia, tarjeta…)"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
            />
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-300">
              <input name="markPaidNow" type="checkbox" className="h-4 w-4" /> Ya está pagado
            </label>
          </div>
          {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-sky-500/20 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
          >
            Guardar pago
          </button>
        </form>
      )}

      {payments.length === 0 ? (
        <p className="text-sm text-gray-500">Este cliente no tiene pagos registrados.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => {
            const urgency = getDueDateUrgency(payment.dueDate);
            return (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">{formatCurrencyMXN(payment.amount)}</p>
                  <p className="text-xs text-gray-400">
                    Vence {payment.dueDate}
                    {payment.method ? ` · ${payment.method}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {payment.status === "pagado" ? (
                    <StatusBadge status="pagado" />
                  ) : (
                    <>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(urgency)}`}
                      >
                        {urgencyLabel(urgency)}
                      </span>
                      <button
                        type="button"
                        disabled={markingId === payment.id}
                        onClick={() => handleMarkPaid(payment.id)}
                        className="flex cursor-pointer items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagado
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Shows the client's chronological activity feed with a quick "add a note" input. */
function HistoryPanel({
  clientId,
  history,
  onChanged,
}: {
  clientId: string;
  history: ClientDetail["history"];
  onChanged: () => void;
}) {
  const [formKey, setFormKey] = useState(0);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await addHistoryEntryAction(prevState, formData);
    if (result && "success" in result) {
      setFormKey((k) => k + 1);
      onChanged();
    }
    return result;
  }, null);

  return (
    <div>
      <SectionHeading icon={MessageSquare} title="Historial" />

      <form key={formKey} action={formAction} className="mb-4 flex gap-2">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="entryType" value="nota" />
        <input
          name="description"
          required
          placeholder="Agregar una nota…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Agregar
        </button>
      </form>
      {state && "error" in state && <p className="mb-2 text-xs text-red-400">{state.error}</p>}

      {history.length === 0 ? (
        <p className="text-sm text-gray-500">Sin actividad todavía.</p>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/5 bg-white/2 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300">
                  {HISTORY_LABELS[entry.entryType] ?? entry.entryType}
                </span>
                <span className="text-[11px] text-gray-500">
                  {new Date(entry.createdAt).toLocaleString("es-MX")}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-gray-200">{entry.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
