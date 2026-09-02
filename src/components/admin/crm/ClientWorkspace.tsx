"use client";

/**
 * In-dashboard client workspace: replaces the `ClientsSection` list within the
 * CRM shell (sidebar stays) with one client's full breakdown — identity +
 * status, KPIs, contacts, tax/billing data, plans, payments, activity history,
 * and a roll-up of the client's projects, quotes, invoices, tasks, services,
 * support tickets and assets, each with a contextual "+ Nuevo" where it
 * applies. The client's own detail is fetched here; the related entities come
 * as props (already filtered) and a create calls `router.refresh()`.
 */

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarClock,
  CheckCircle2,
  FileText,
  HandCoins,
  Landmark,
  LifeBuoy,
  ListChecks,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Receipt,
  ScrollText,
  Server,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  addHistoryEntryAction,
  createPlanAction,
  deleteClientAction,
  deletePaymentAction,
  deletePlanAction,
  getClientDetail,
  markPaymentPaidAction,
  recordPaymentAction,
  updateClientBillingAction,
  updateClientStatusAction,
  updatePaymentAction,
  updatePlanAction,
  type ClientBilling,
  type ClientDetail,
  type ClientStatus,
  type CrmActionState,
  type CrmClient,
  type PaymentStatus,
} from "@/lib/crm/clients";
import { createProjectAction, type CrmProject } from "@/lib/crm/projects";
import type { CrmQuote } from "@/lib/crm/quotes";
import { createInvoiceAction, createInvoiceFromPaymentAction, type CrmInvoice } from "@/lib/crm/invoices";
import { createTaskAction, type CrmTask } from "@/lib/crm/tasks";
import { assignServiceToClientAction, type CrmContract } from "@/lib/crm/contracts";
import { UNIT_LABELS, type CrmService } from "@/lib/crm/contract-types";
import { PLAN_MIRROR_NOTE } from "@/lib/crm/plan-mirror";
import { buildClientLedger } from "@/lib/crm/ledger";
import type { ItTicket } from "@/lib/it/ticket-types";
import type { ItAsset } from "@/lib/it/asset-types";
import { formatCurrencyMXN, initialsOf } from "@/lib/crm/format";
import { daysUntil, getDueDateUrgency } from "@/lib/crm/plan-status";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusBadge from "./StatusBadge";
import ClientForm from "./ClientForm";
import QuoteFormModal from "./QuoteFormModal";
import ContactsPanel from "./ContactsPanel";

/** All CRM/IT entities for one client, already filtered by the route. */
export type ClientRelated = {
  projects: CrmProject[];
  quotes: CrmQuote[];
  invoices: CrmInvoice[];
  tasks: CrmTask[];
  contracts: CrmContract[];
  tickets: ItTicket[];
  assets: ItAsset[];
};

const CLIENT_STATUS_OPTIONS: ClientStatus[] = ["lead", "negociacion", "activo", "inactivo"];

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

/** Badge color class for a payment status, used in the account-statement ledger. */
function cobroStatusClass(status: PaymentStatus) {
  if (status === "pagado") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  if (status === "vencido") return "border-red-400/30 bg-red-500/10 text-red-300";
  return "border-amber-400/30 bg-amber-500/10 text-amber-300";
}

/** Spanish label for a payment status. */
function cobroStatusLabel(status: PaymentStatus) {
  if (status === "pagado") return "Pagado";
  if (status === "vencido") return "Vencido";
  return "Pendiente";
}

/** Relative-days phrase for a due date (e.g. "en 5 d", "vence hoy", "3 d de atraso"). */
function relativeDueLabel(dueDate: string) {
  const d = daysUntil(dueDate);
  if (d < 0) return `${Math.abs(d)} d de atraso`;
  if (d === 0) return "vence hoy";
  return `en ${d} d`;
}

/** Section shell: back button, delete action, and the client's full breakdown. */
export default function ClientWorkspace({
  clientId,
  related,
  clients,
  serviceOptions,
  catalogServices = [],
  canWriteBilling,
  canReadBilling,
  canUseSupport,
  onBack,
}: {
  clientId: string;
  related: ClientRelated;
  /** Only used to feed `QuoteFormModal`; a one-element list (this client) is enough. */
  clients: CrmClient[];
  serviceOptions: string[];
  /** Active catalog services, for the "Añadir servicio" picker in the Servicios panel. */
  catalogServices?: CrmService[];
  canWriteBilling: boolean;
  canReadBilling: boolean;
  canUseSupport: boolean;
  onBack: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = async () => {
    setDetail(await getClientDetail(clientId));
    setLoading(false);
  };

  useEffect(() => {
    // Fetch on mount / when the opened client changes — a valid effect use.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-sky-400/40 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a clientes
        </button>
        {detail && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar cliente
          </button>
        )}
      </div>

      {loading || !detail ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando cliente…
        </div>
      ) : (
        <ClientDetailContent
          detail={detail}
          clients={clients}
          serviceOptions={serviceOptions}
          catalogServices={catalogServices}
          canWriteBilling={canWriteBilling}
          canReadBilling={canReadBilling}
          canUseSupport={canUseSupport}
          related={related}
          onChanged={refresh}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar cliente"
        body={detail ? `Se eliminará ${detail.client.company}.` : undefined}
        onConfirm={async () => {
          await deleteClientAction(clientId);
          onBack();
          router.refresh();
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

const KPI_TONES = {
  blue: "bg-blue-500/10 text-blue-300 ring-blue-400/20",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-400/20",
  rose: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
} as const;

/** One compact stat in the client-header strip. */
function DetailKpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  tone: keyof typeof KPI_TONES;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/2 p-2.5">
      <div className="flex items-center gap-1.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md ring-1 ${KPI_TONES[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

/** Client header (identity, status, KPIs, edit) plus every panel. */
function ClientDetailContent({
  detail,
  clients,
  serviceOptions,
  catalogServices,
  canWriteBilling,
  canReadBilling,
  canUseSupport,
  related,
  onChanged,
}: {
  detail: ClientDetail;
  clients: CrmClient[];
  serviceOptions: string[];
  catalogServices: CrmService[];
  canWriteBilling: boolean;
  canReadBilling: boolean;
  canUseSupport: boolean;
  related: ClientRelated;
  onChanged: () => void;
}) {
  const { client, billing, profile, contacts, history, plans, payments } = detail;
  const [editing, setEditing] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const handleStatusChange = async (status: ClientStatus) => {
    if (status === client.status || savingStatus) return;
    setSavingStatus(true);
    await updateClientStatusAction(client.id, status);
    setSavingStatus(false);
    onChanged();
  };

  // A plan's mirror service shows via PlansPanel — hide it from the services list.
  const planContractIds = new Set(
    detail.plans.map((p) => p.contractId).filter((id): id is string => !!id)
  );

  const activeProjects = related.projects.filter((p) => p.status !== "completado").length;
  const openQuotes = related.quotes.filter((q) => q.status === "borrador" || q.status === "enviada").length;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-500/25 to-indigo-500/20 text-base font-bold text-sky-200 ring-2 ring-sky-400/30">
            {initialsOf(client.company)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{client.company}</h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-sm text-gray-400">
              {client.name}
              {profile.jobTitle ? ` · ${profile.jobTitle}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((o) => !o)}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" /> {editing ? "Cerrar" : "Editar"}
          </button>
        </div>
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
          {profile.whatsapp && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> WhatsApp {profile.whatsapp}
            </span>
          )}
        </div>
        {(() => {
          const meta = [
            client.service,
            profile.industry,
            profile.city,
            profile.companySize && `${profile.companySize} empl.`,
            profile.source && `vía ${profile.source}`,
          ].filter(Boolean);
          return meta.length > 0 ? (
            <p className="mt-1 text-xs text-gray-500">{meta.join(" · ")}</p>
          ) : null;
        })()}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <DetailKpi icon={Briefcase} label="Proyectos activos" value={String(activeProjects)} tone="blue" />
          <DetailKpi icon={FileText} label="Cotizaciones abiertas" value={String(openQuotes)} tone="fuchsia" />
        </div>

        {editing ? (
          <div className="mt-4">
            <ClientForm
              client={client}
              profile={profile}
              serviceOptions={serviceOptions}
              onDone={() => {
                setEditing(false);
                onChanged();
              }}
            />
          </div>
        ) : (
          <>
            {client.notes && (
              <p className="mt-3 whitespace-pre-wrap rounded-xl border border-white/5 bg-white/2 p-3 text-sm text-gray-300">
                {client.notes}
              </p>
            )}
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Estado</p>
              <div className="flex flex-wrap gap-2">
                {CLIENT_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={savingStatus}
                    onClick={() => handleStatusChange(status)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      client.status === status
                        ? "border-sky-400 bg-sky-500/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-sky-400/40 hover:text-white"
                    }`}
                  >
                    <StatusBadge status={status} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <AccountStatementPanel payments={payments} plans={plans} invoices={related.invoices} />
      <ContactsPanel clientId={client.id} contacts={contacts} onChanged={onChanged} />
      <BillingPanel clientId={client.id} billing={billing} onChanged={onChanged} />
      <PlansPanel clientId={client.id} plans={plans} onChanged={onChanged} />
      <PaymentsPanel
        clientId={client.id}
        plans={plans}
        payments={payments}
        invoices={related.invoices}
        canWriteBilling={canWriteBilling}
        onChanged={onChanged}
      />
      <RelatedPanels
        clientId={client.id}
        clients={clients}
        catalogServices={catalogServices}
        planContractIds={planContractIds}
        canWriteBilling={canWriteBilling}
        canReadBilling={canReadBilling}
        canUseSupport={canUseSupport}
        related={related}
        onChanged={onChanged}
      />
      <HistoryPanel clientId={client.id} history={history} onChanged={onChanged} />
    </div>
  );
}

/** "Septiembre 2026" from a YYYY-MM-DD (or ISO) date string. */
function monthLabel(dateStr: string) {
  const s = new Date(`${dateStr.slice(0, 10)}T00:00:00`).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * "Estado de cuenta": what this client has paid and what they owe next, in one
 * card. Two figures (Cobrado histórico / Por cobrar), a plain-language line —
 * "<mes> saldado · sigue <monto> el <fecha>" — and a newest-first stream of
 * movimientos: cobros (with folio + estado) and cada servicio contratado
 * (nombre, monto, fecha). Egresos are company-level and intentionally absent
 * here. Read-only; everything derives from data the workspace already holds.
 */
function AccountStatementPanel({
  payments,
  plans,
  invoices,
}: {
  payments: ClientDetail["payments"];
  plans: ClientDetail["plans"];
  invoices: CrmInvoice[];
}) {
  const paidItems = payments.filter((p) => p.status === "pagado");
  const cobrado = paidItems.reduce((s, p) => s + p.amount, 0);

  const pendingItems = payments
    .filter((p) => p.status === "pendiente" || p.status === "vencido")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const pendingSum = pendingItems.reduce((s, p) => s + p.amount, 0);
  const overdueSum = pendingItems
    .filter((p) => p.status === "vencido")
    .reduce((s, p) => s + p.amount, 0);

  const activePlan =
    [...plans]
      .filter((p) => p.status === "activo")
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0] ?? null;

  // "Lo que sigue": the nearest real pending charge, else the active plan's next run.
  const next = pendingItems[0]
    ? {
        amount: pendingItems[0].amount,
        date: pendingItems[0].dueDate,
        label: pendingItems[0].planId
          ? (plans.find((pl) => pl.id === pendingItems[0].planId)?.name ?? "Cobro")
          : "Cobro suelto",
      }
    : activePlan
      ? { amount: activePlan.amount, date: activePlan.nextDueDate, label: activePlan.name }
      : null;

  const porCobrar = pendingSum + (pendingItems.length === 0 && activePlan ? activePlan.amount : 0);

  const lastPaid = paidItems
    .map((p) => ({ ...p, when: p.paidDate ?? p.dueDate }))
    .sort((a, b) => b.when.localeCompare(a.when))[0];
  const lastPaidInvoice = lastPaid ? invoices.find((i) => i.paymentId === lastPaid.id) : undefined;

  // Label for the month right after the last covered period — used to prompt
  // for the next charge when there's no plan or pending payment yet.
  const afterLastPeriod = lastPaid
    ? (() => {
        const d = new Date(`${lastPaid.dueDate.slice(0, 10)}T00:00:00`);
        return monthLabel(new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString());
      })()
    : "";

  const ledger = buildClientLedger(payments, plans, invoices);

  return (
    <div>
      <div className="mb-3">
        <SectionHeading icon={Wallet} title="Estado de cuenta" tone="emerald" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DetailKpi icon={Wallet} label="Cobrado (histórico)" value={formatCurrencyMXN(cobrado)} tone="emerald" />
        <DetailKpi
          icon={HandCoins}
          label="Por cobrar"
          value={porCobrar > 0 ? formatCurrencyMXN(porCobrar) : "Nada pendiente"}
          tone={overdueSum > 0 ? "rose" : porCobrar > 0 ? "fuchsia" : "emerald"}
        />
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl border border-white/5 bg-white/2 p-3 text-sm">
        {lastPaid ? (
          <p className="flex flex-wrap items-center gap-1.5 text-gray-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            <span className="font-semibold text-white">{monthLabel(lastPaid.dueDate)}</span> saldado —{" "}
            {formatCurrencyMXN(lastPaid.amount)} pagado el {lastPaid.when}
            {lastPaidInvoice ? ` · factura ${lastPaidInvoice.number}` : ""}
          </p>
        ) : (
          <p className="text-gray-400">Todavía no hay cobros liquidados.</p>
        )}

        {overdueSum > 0 && (
          <p className="flex flex-wrap items-center gap-1.5 text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Saldo vencido: <span className="font-semibold">{formatCurrencyMXN(overdueSum)}</span>
          </p>
        )}

        {next ? (
          <p className="flex flex-wrap items-center gap-1.5 text-gray-200">
            <CalendarClock className="h-4 w-4 shrink-0 text-fuchsia-300" />
            Sigue: <span className="font-semibold text-white">{formatCurrencyMXN(next.amount)}</span> ·{" "}
            {next.label} · vence {monthLabel(next.date)} ({next.date}, {relativeDueLabel(next.date)})
          </p>
        ) : (
          <p className="flex flex-wrap items-center gap-1.5 text-amber-300/90">
            <CalendarClock className="h-4 w-4 shrink-0" />
            {lastPaid
              ? `Falta registrar el cobro de ${afterLastPeriod}: créalo en "Planes" (recurrente) o en "Pagos".`
              : "Sin plan activo ni cobros programados."}
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Movimientos</p>
        {ledger.length === 0 ? (
          <p className="text-sm text-gray-500">Sin cobros ni servicios registrados todavía.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <div
                key={`${entry.kind}-${entry.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-white">
                    {entry.label}
                    {entry.kind === "servicio" && (
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                        servicio
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {entry.date}
                    {entry.invoiceNumber ? ` · factura ${entry.invoiceNumber}` : ""}
                    {entry.detail ? ` · ${entry.detail}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {entry.kind === "cobro" && entry.status && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cobroStatusClass(
                        entry.status
                      )}`}
                    >
                      {cobroStatusLabel(entry.status)}
                    </span>
                  )}
                  <span
                    className={
                      entry.kind === "cobro"
                        ? "font-semibold text-emerald-300"
                        : "font-semibold text-cyan-200"
                    }
                  >
                    {entry.kind === "cobro" ? `+${formatCurrencyMXN(entry.amount)}` : formatCurrencyMXN(entry.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const RELATED_FIELD =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** Optional "Sin proyecto" + this client's projects, for the invoice/task forms. */
function ProjectPicker({ projects }: { projects: CrmProject[] }) {
  if (projects.length === 0) return null;
  return (
    <select name="projectId" defaultValue="" className={RELATED_FIELD}>
      <option value="">Sin proyecto</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

const CLOSED_TICKET_STATUSES = new Set(["resuelto", "cerrado"]);

/**
 * Roll-up of everything hanging off a client — projects, quotes, invoices,
 * tasks (with a contextual "+ Nuevo" each), plus read-only views of the
 * client's services (contratos), support tickets and assets. Every section
 * is optional: a client with none of them just shows empty states.
 */
function RelatedPanels({
  clientId,
  clients,
  catalogServices,
  planContractIds,
  canWriteBilling,
  canReadBilling,
  canUseSupport,
  related,
  onChanged,
}: {
  clientId: string;
  clients: CrmClient[];
  catalogServices: CrmService[];
  /** ids of contracts that mirror a plan — hidden from the services list. */
  planContractIds: Set<string>;
  canWriteBilling: boolean;
  canReadBilling: boolean;
  canUseSupport: boolean;
  related: ClientRelated;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { projects, quotes, invoices, tasks, contracts, tickets, assets } = related;
  const openTasks = tasks.filter((t) => t.status !== "terminado");
  const openTickets = tickets.filter((t) => !CLOSED_TICKET_STATUSES.has(t.status));
  const [openForm, setOpenForm] = useState<null | "proyecto" | "factura" | "tarea">(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const afterCreate = () => {
    setOpenForm(null);
    router.refresh();
    onChanged();
  };

  const [projectState, projectAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await createProjectAction(prev, fd);
    if (res && "success" in res) afterCreate();
    return res;
  }, null);
  const [invoiceState, invoiceAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await createInvoiceAction(prev, fd);
    if (res && "success" in res) afterCreate();
    return res;
  }, null);
  const [taskState, taskAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await createTaskAction(prev, fd);
    if (res && "success" in res) afterCreate();
    return res;
  }, null);

  const toggle = (f: "proyecto" | "factura" | "tarea") => setOpenForm((cur) => (cur === f ? null : f));

  return (
    <>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading icon={Briefcase} title={`Proyectos (${projects.length})`} tone="blue" />
          <PanelToggle open={openForm === "proyecto"} onClick={() => toggle("proyecto")} label="Nuevo" />
        </div>
        {openForm === "proyecto" && (
          <form action={projectAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <input type="hidden" name="clientId" value={clientId} />
            <input name="name" required placeholder="Nombre del proyecto" className={RELATED_FIELD} />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="Presupuesto MXN"
                className={RELATED_FIELD}
              />
              <input name="dueDate" type="date" className={RELATED_FIELD} />
            </div>
            <input name="description" placeholder="Descripción (opcional)" className={RELATED_FIELD} />
            {projectState && "error" in projectState && (
              <p className="text-xs text-red-400">{projectState.error}</p>
            )}
            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-blue-500/20 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/30"
            >
              Guardar proyecto
            </button>
          </form>
        )}
        {projects.length === 0 ? (
          <p className="text-sm text-gray-500">Sin proyectos para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {p.progress}% · {formatCurrencyMXN(p.budget)}
                    {p.dueDate ? ` · entrega ${p.dueDate}` : ""}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading icon={FileText} title={`Cotizaciones (${quotes.length})`} tone="fuchsia" />
          <PanelToggle open={quoteOpen} onClick={() => setQuoteOpen((o) => !o)} label="Nueva" />
        </div>
        {quotes.length === 0 ? (
          <p className="text-sm text-gray-500">Sin cotizaciones para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">{q.number}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyMXN(q.total)}
                    {q.validUntil ? ` · vigencia ${q.validUntil}` : ""}
                  </p>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading icon={Receipt} title={`Facturas (${invoices.length})`} tone="teal" />
          {canWriteBilling && (
            <PanelToggle open={openForm === "factura"} onClick={() => toggle("factura")} label="Nueva" />
          )}
        </div>
        {canWriteBilling && openForm === "factura" && (
          <form action={invoiceAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <input type="hidden" name="clientId" value={clientId} />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Monto MXN"
                className={RELATED_FIELD}
              />
              <input name="dueDate" type="date" required className={RELATED_FIELD} />
            </div>
            <ProjectPicker projects={projects} />
            {invoiceState && "error" in invoiceState && (
              <p className="text-xs text-red-400">{invoiceState.error}</p>
            )}
            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-teal-500/20 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-500/30"
            >
              Guardar factura
            </button>
          </form>
        )}
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500">Sin facturas para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">{inv.number}</p>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyMXN(inv.amount)} · vence {inv.dueDate}
                  </p>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading icon={ListChecks} title={`Tareas abiertas (${openTasks.length})`} tone="indigo" />
          <PanelToggle open={openForm === "tarea"} onClick={() => toggle("tarea")} label="Nueva" />
        </div>
        {openForm === "tarea" && (
          <form action={taskAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <input type="hidden" name="clientId" value={clientId} />
            <input name="title" required placeholder="Título de la tarea" className={RELATED_FIELD} />
            <div className="grid grid-cols-2 gap-2">
              <input name="dueDate" type="date" className={RELATED_FIELD} />
              <ProjectPicker projects={projects} />
            </div>
            {taskState && "error" in taskState && <p className="text-xs text-red-400">{taskState.error}</p>}
            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-indigo-500/20 py-2 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/30"
            >
              Guardar tarea
            </button>
          </form>
        )}
        {openTasks.length === 0 ? (
          <p className="text-sm text-gray-500">Sin tareas abiertas para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">{t.title}</p>
                  {t.dueDate && <p className="text-xs text-gray-400">Vence {t.dueDate}</p>}
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {canReadBilling && (
        <ClientServicesPanel
          clientId={clientId}
          contracts={contracts.filter(
            (c) => !planContractIds.has(c.id) && !(c.notes?.startsWith(PLAN_MIRROR_NOTE) ?? false)
          )}
          catalogServices={catalogServices}
          onChanged={afterCreate}
        />
      )}

      {canUseSupport && (
        <div>
          <div className="mb-3">
            <SectionHeading icon={LifeBuoy} title={`Soporte — tickets abiertos (${openTickets.length})`} tone="rose" />
          </div>
          {openTickets.length === 0 ? (
            <p className="text-sm text-gray-500">Sin tickets abiertos para este cliente.</p>
          ) : (
            <div className="space-y-2">
              {openTickets.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
                >
                  <div>
                    <p className="font-medium text-white">
                      {t.number} · {t.subject}
                    </p>
                    <p className="text-xs text-gray-400">
                      Prioridad {t.priority}
                      {t.slaDueAt ? ` · SLA ${new Date(t.slaDueAt).toLocaleDateString("es-MX")}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canUseSupport && (
        <div>
          <div className="mb-3">
            <SectionHeading icon={Server} title={`Activos (${assets.length})`} tone="orange" />
          </div>
          {assets.length === 0 ? (
            <p className="text-sm text-gray-500">Sin activos para este cliente.</p>
          ) : (
            <div className="space-y-2">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{a.name}</p>
                    <p className="text-xs text-gray-400">
                      {a.assetType.replace(/_/g, " ")}
                      {a.identifier ? ` · ${a.identifier}` : ""}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {quoteOpen && (
        <QuoteFormModal
          clients={clients}
          catalogServices={catalogServices}
          lockedClientId={clientId}
          onClose={() => {
            setQuoteOpen(false);
            router.refresh();
            onChanged();
          }}
        />
      )}
    </>
  );
}

/**
 * The client's contracted services (`crm_contracts`) plus a picker to add one
 * from the catalog. Adding always goes through a confirm dialog first, then
 * `assignServiceToClientAction` (which creates the contract + catalog line).
 */
function ClientServicesPanel({
  clientId,
  contracts,
  catalogServices,
  onChanged,
}: {
  clientId: string;
  contracts: CrmContract[];
  catalogServices: CrmService[];
  onChanged: () => void;
}) {
  const active = catalogServices.filter((s) => s.active);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [confirmService, setConfirmService] = useState<CrmService | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askConfirm = () => {
    const svc = active.find((s) => s.id === selectedId);
    if (svc) setConfirmService(svc);
  };

  const doAssign = async () => {
    if (!confirmService) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("serviceId", confirmService.id);
    fd.set("clientId", clientId);
    fd.set("status", "activo");
    const res = await assignServiceToClientAction(null, fd);
    setBusy(false);
    setConfirmService(null);
    if (res && "error" in res) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setSelectedId("");
    onChanged();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading icon={ScrollText} title={`Servicios (${contracts.length})`} tone="cyan" />
        {active.length > 0 && <PanelToggle open={open} onClick={() => setOpen((o) => !o)} label="Añadir" />}
      </div>

      {open && (
        <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={RELATED_FIELD}
          >
            <option value="">Elige un servicio del catálogo…</option>
            {active.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatCurrencyMXN(s.defaultRate)} · {UNIT_LABELS[s.unit]}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="button"
            disabled={!selectedId || busy}
            onClick={askConfirm}
            className="w-full cursor-pointer rounded-lg bg-cyan-500/20 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-50"
          >
            Añadir servicio
          </button>
        </div>
      )}

      {contracts.length === 0 ? (
        <p className="text-sm text-gray-500">Sin servicios contratados para este cliente.</p>
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
            >
              <div>
                <p className="font-medium text-white">{c.title}</p>
                <p className="text-xs text-gray-400">
                  {c.billingAmount != null
                    ? `${formatCurrencyMXN(c.billingAmount)}${c.billingCycle ? ` / ${c.billingCycle}` : ""}`
                    : "Sin monto"}
                  {c.includedHours != null ? ` · ${c.includedHours} h incluidas` : ""}
                  {c.endDate ? ` · vence ${c.endDate}` : ""}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmService !== null}
        tone="info"
        title="Añadir servicio al cliente"
        body={
          confirmService
            ? `Se contratará "${confirmService.name}" como servicio activo (${formatCurrencyMXN(
                confirmService.defaultRate
              )} · ${UNIT_LABELS[confirmService.unit]}).`
            : undefined
        }
        confirmLabel="Añadir"
        onConfirm={doAssign}
        onClose={() => setConfirmService(null)}
      />
    </div>
  );
}

const HEADING_TONES = {
  sky: "bg-sky-500/15 text-sky-300",
  violet: "bg-violet-500/15 text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  amber: "bg-amber-500/15 text-amber-300",
  blue: "bg-blue-500/15 text-blue-300",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-300",
  teal: "bg-teal-500/15 text-teal-300",
  indigo: "bg-indigo-500/15 text-indigo-300",
  slate: "bg-slate-500/15 text-slate-300",
  cyan: "bg-cyan-500/15 text-cyan-300",
  rose: "bg-rose-500/15 text-rose-300",
  orange: "bg-orange-500/15 text-orange-300",
} as const;

/** Colored icon chip + uppercase title heading shared by the panels below. */
function SectionHeading({
  icon: Icon,
  title,
  tone = "sky",
}: {
  icon: typeof Calendar;
  title: string;
  tone?: keyof typeof HEADING_TONES;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-200">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${HEADING_TONES[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </h3>
  );
}

/** Pill button used to toggle a panel's inline "+ Nuevo" form. */
function PanelToggle({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 transition-colors hover:border-sky-400/40 hover:text-white"
    >
      {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {open ? "Cerrar" : label}
    </button>
  );
}

// Curated subsets of the SAT catalogs — enough for the common cases, and the
// inputs stay free-text (via `list=`) so any other code can still be typed.
const TAX_REGIMES: { code: string; label: string }[] = [
  { code: "601", label: "General de Ley Personas Morales" },
  { code: "603", label: "Personas Morales con Fines no Lucrativos" },
  { code: "605", label: "Sueldos y Salarios e Ingresos Asimilados" },
  { code: "606", label: "Arrendamiento" },
  { code: "612", label: "Personas Físicas con Actividades Empresariales y Profesionales" },
  { code: "616", label: "Sin obligaciones fiscales" },
  { code: "621", label: "Incorporación Fiscal" },
  { code: "626", label: "Régimen Simplificado de Confianza (RESICO)" },
];
const CFDI_USES: { code: string; label: string }[] = [
  { code: "G01", label: "Adquisición de mercancías" },
  { code: "G03", label: "Gastos en general" },
  { code: "I01", label: "Construcciones" },
  { code: "I08", label: "Otra maquinaria y equipo" },
  { code: "P01", label: "Por definir" },
  { code: "S01", label: "Sin efectos fiscales" },
  { code: "CP01", label: "Pagos" },
];
const PAYMENT_FORMS: { code: string; label: string }[] = [
  { code: "01", label: "Efectivo" },
  { code: "02", label: "Cheque nominativo" },
  { code: "03", label: "Transferencia electrónica de fondos" },
  { code: "04", label: "Tarjeta de crédito" },
  { code: "28", label: "Tarjeta de débito" },
  { code: "99", label: "Por definir" },
];

const BILLING_FIELD =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-sky-400/40";

/** One "label: value" line in the read-only billing summary; renders nothing when empty. */
function BillingRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right text-gray-200">{value}</span>
    </div>
  );
}

/**
 * "Datos fiscales y facturación" panel: CFDI 4.0 receptor fields, payment
 * preferences and a postal address. Collapsed to a summary (or an empty-state
 * prompt) until opened; the form saves via `updateClientBillingAction`.
 */
function BillingPanel({
  clientId,
  billing,
  onChanged,
}: {
  clientId: string;
  billing: ClientBilling;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prevState, formData) => {
    const result = await updateClientBillingAction(prevState, formData);
    if (result && "success" in result) {
      setOpen(false);
      onChanged();
    }
    return result;
  }, null);

  const hasData = Boolean(
    billing.taxName ||
      billing.rfc ||
      billing.taxRegime ||
      billing.cfdiUse ||
      billing.taxZip ||
      billing.billingEmail ||
      billing.addressStreet ||
      billing.website
  );

  const addressLine = [
    billing.addressStreet,
    billing.addressExt && `#${billing.addressExt}`,
    billing.addressInt && `int. ${billing.addressInt}`,
    billing.addressNeighborhood,
    billing.addressCity,
    billing.addressState,
    billing.taxZip && `CP ${billing.taxZip}`,
    billing.addressCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const paymentLine = [
    billing.paymentForm,
    billing.paymentMethod,
    billing.paymentTermsDays != null ? `${billing.paymentTermsDays} días de crédito` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading icon={Landmark} title="Datos fiscales y facturación" tone="emerald" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
        >
          {open ? "Cerrar" : hasData ? "Editar" : "Completar"}
        </button>
      </div>

      {open ? (
        <form action={formAction} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <input type="hidden" name="clientId" value={clientId} />

          <datalist id="tax-regimes">
            {TAX_REGIMES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </datalist>
          <datalist id="cfdi-uses">
            {CFDI_USES.map((u) => (
              <option key={u.code} value={u.code}>
                {u.label}
              </option>
            ))}
          </datalist>
          <datalist id="payment-forms">
            {PAYMENT_FORMS.map((f) => (
              <option key={f.code} value={f.code}>
                {f.label}
              </option>
            ))}
          </datalist>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Fiscales (receptor CFDI)</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name="taxName"
                defaultValue={billing.taxName ?? ""}
                placeholder="Razón social (tal cual el SAT)"
                className={`${BILLING_FIELD} sm:col-span-2`}
              />
              <input name="rfc" defaultValue={billing.rfc ?? ""} placeholder="RFC" className={BILLING_FIELD} />
              <input
                name="taxZip"
                defaultValue={billing.taxZip ?? ""}
                inputMode="numeric"
                placeholder="CP del domicilio fiscal"
                className={BILLING_FIELD}
              />
              <input
                name="taxRegime"
                list="tax-regimes"
                defaultValue={billing.taxRegime ?? ""}
                placeholder="Régimen fiscal (código)"
                className={BILLING_FIELD}
              />
              <input
                name="cfdiUse"
                list="cfdi-uses"
                defaultValue={billing.cfdiUse ?? ""}
                placeholder="Uso de CFDI (código)"
                className={BILLING_FIELD}
              />
              <input
                name="billingEmail"
                type="email"
                defaultValue={billing.billingEmail ?? ""}
                placeholder="Email para envío de factura"
                className={`${BILLING_FIELD} sm:col-span-2`}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Pago</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name="paymentForm"
                list="payment-forms"
                defaultValue={billing.paymentForm ?? ""}
                placeholder="Forma de pago (código)"
                className={BILLING_FIELD}
              />
              <select name="paymentMethod" defaultValue={billing.paymentMethod ?? ""} className={BILLING_FIELD}>
                <option value="">Método de pago…</option>
                <option value="PUE">PUE — Pago en una sola exhibición</option>
                <option value="PPD">PPD — Pago en parcialidades o diferido</option>
              </select>
              <input
                name="paymentTermsDays"
                type="number"
                min="0"
                defaultValue={billing.paymentTermsDays ?? ""}
                placeholder="Días de crédito"
                className={BILLING_FIELD}
              />
              <input
                name="currency"
                defaultValue={billing.currency || "MXN"}
                placeholder="Moneda"
                className={BILLING_FIELD}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Domicilio</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name="addressStreet"
                defaultValue={billing.addressStreet ?? ""}
                placeholder="Calle"
                className={`${BILLING_FIELD} sm:col-span-2`}
              />
              <input
                name="addressExt"
                defaultValue={billing.addressExt ?? ""}
                placeholder="No. exterior"
                className={BILLING_FIELD}
              />
              <input
                name="addressInt"
                defaultValue={billing.addressInt ?? ""}
                placeholder="No. interior"
                className={BILLING_FIELD}
              />
              <input
                name="addressNeighborhood"
                defaultValue={billing.addressNeighborhood ?? ""}
                placeholder="Colonia"
                className={BILLING_FIELD}
              />
              <input
                name="addressCity"
                defaultValue={billing.addressCity ?? ""}
                placeholder="Municipio / Alcaldía"
                className={BILLING_FIELD}
              />
              <input
                name="addressState"
                defaultValue={billing.addressState ?? ""}
                placeholder="Estado"
                className={BILLING_FIELD}
              />
              <input
                name="addressCountry"
                defaultValue={billing.addressCountry || "México"}
                placeholder="País"
                className={BILLING_FIELD}
              />
            </div>
          </div>

          <input
            name="website"
            defaultValue={billing.website ?? ""}
            placeholder="Sitio web"
            className={BILLING_FIELD}
          />

          {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
            >
              Guardar datos fiscales
            </button>
          </div>
        </form>
      ) : hasData ? (
        <div className="space-y-1 rounded-xl border border-white/5 bg-white/2 p-3 text-sm">
          <BillingRow label="Razón social" value={billing.taxName} />
          <BillingRow label="RFC" value={billing.rfc} />
          <BillingRow label="Régimen" value={billing.taxRegime} />
          <BillingRow label="Uso de CFDI" value={billing.cfdiUse} />
          <BillingRow label="Email facturación" value={billing.billingEmail} />
          <BillingRow label="Pago" value={paymentLine || null} />
          <BillingRow label="Domicilio" value={addressLine || null} />
          <BillingRow label="Sitio web" value={billing.website} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">Aún no se capturan los datos fiscales de este cliente.</p>
      )}
    </div>
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ClientDetail["plans"][number] | null>(null);
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
          {plans.map((plan) =>
            editingId === plan.id ? (
              <PlanEditForm
                key={plan.id}
                plan={plan}
                clientId={clientId}
                onDone={() => {
                  setEditingId(null);
                  onChanged();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {plan.name}
                    {plan.status !== "activo" && (
                      <span className="ml-2 rounded-full border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                        {plan.status}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyMXN(plan.amount)} / {plan.billingCycle} · corte día {plan.cutoffDay}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(
                      getDueDateUrgency(plan.nextDueDate)
                    )}`}
                  >
                    {urgencyLabel(getDueDateUrgency(plan.nextDueDate))} · vence {plan.nextDueDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(plan.id)}
                    aria-label={`Editar plan ${plan.name}`}
                    className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-sky-400/40 hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(plan)}
                    aria-label={`Eliminar plan ${plan.name}`}
                    className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-500 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-400"
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
        title="Eliminar plan"
        body={
          toDelete
            ? `Se eliminará el plan "${toDelete.name}". Dejará de generar cobros (recuperable).`
            : undefined
        }
        onConfirm={async () => {
          if (toDelete) {
            await deletePlanAction(toDelete.id, clientId);
            onChanged();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/**
 * Inline edit for one plan: nombre, monto, ciclo, día de corte, próximo
 * vencimiento y estado. Corrige errores de captura (p. ej. un año equivocado).
 */
function PlanEditForm({
  plan,
  clientId,
  onDone,
  onCancel,
}: {
  plan: ClientDetail["plans"][number];
  clientId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await updatePlanAction(prev, fd);
    if (res && "success" in res) onDone();
    return res;
  }, null);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-sky-400/30 bg-white/5 p-4">
      <input type="hidden" name="planId" value={plan.id} />
      <input type="hidden" name="clientId" value={clientId} />
      <input name="name" required defaultValue={plan.name} placeholder="Nombre del plan" className={RELATED_FIELD} />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={plan.amount}
          placeholder="Monto MXN"
          className={RELATED_FIELD}
        />
        <select name="billingCycle" defaultValue={plan.billingCycle} className={RELATED_FIELD}>
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
            defaultValue={plan.cutoffDay}
            className={`mt-1 ${RELATED_FIELD}`}
          />
        </label>
        <label className="text-xs text-gray-400">
          Próximo vencimiento
          <input
            name="nextDueDate"
            type="date"
            required
            defaultValue={plan.nextDueDate}
            className={`mt-1 ${RELATED_FIELD}`}
          />
        </label>
        <select name="status" defaultValue={plan.status} className={`col-span-2 ${RELATED_FIELD}`}>
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Guardar cambios
        </button>
      </div>
    </form>
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
  invoices,
  canWriteBilling,
  onChanged,
}: {
  clientId: string;
  plans: ClientDetail["plans"];
  payments: ClientDetail["payments"];
  invoices: CrmInvoice[];
  canWriteBilling: boolean;
  onChanged: () => void;
}) {
  const router = useRouter();
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
  const [invoicingId, setInvoicingId] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ClientDetail["payments"][number] | null>(null);

  const handleMarkPaid = async (paymentId: string) => {
    setMarkingId(paymentId);
    await markPaymentPaidAction(paymentId, clientId);
    setMarkingId(null);
    onChanged();
  };

  const handleGenerateInvoice = async (paymentId: string) => {
    setInvoicingId(paymentId);
    setInvoiceError(null);
    const res = await createInvoiceFromPaymentAction(paymentId);
    setInvoicingId(null);
    if (res && "error" in res) {
      setInvoiceError(res.error);
      return;
    }
    router.refresh();
    onChanged();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading icon={Receipt} title="Pagos" tone="amber" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 hover:border-sky-400/40 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo pago
        </button>
      </div>

      {invoiceError && <p className="mb-2 text-xs text-red-400">{invoiceError}</p>}

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
          {payments.map((payment) =>
            editingId === payment.id ? (
              <PaymentEditForm
                key={payment.id}
                payment={payment}
                onDone={() => {
                  setEditingId(null);
                  onChanged();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
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
                <div className="flex flex-wrap items-center gap-2">
                  {payment.status === "pagado" ? (
                    <StatusBadge status="pagado" />
                  ) : (
                    <>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${urgencyBadgeClass(
                          getDueDateUrgency(payment.dueDate)
                        )}`}
                      >
                        {urgencyLabel(getDueDateUrgency(payment.dueDate))}
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

                  {invoices.find((i) => i.paymentId === payment.id) ? (
                    <span className="flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-300">
                      <Receipt className="h-3.5 w-3.5" />{" "}
                      {invoices.find((i) => i.paymentId === payment.id)!.number}
                    </span>
                  ) : (
                    canWriteBilling && (
                      <button
                        type="button"
                        disabled={invoicingId === payment.id}
                        onClick={() => handleGenerateInvoice(payment.id)}
                        className="flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-300 hover:border-sky-400/40 hover:text-white disabled:opacity-50"
                      >
                        <Receipt className="h-3.5 w-3.5" /> Generar factura
                      </button>
                    )
                  )}

                  {canWriteBilling && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingId(payment.id)}
                        aria-label="Editar pago"
                        className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-sky-400/40 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(payment)}
                        aria-label="Eliminar pago"
                        className="cursor-pointer rounded-full border border-white/10 p-1.5 text-gray-400 hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar pago"
        body={
          toDelete
            ? `Se eliminará el pago de ${formatCurrencyMXN(toDelete.amount)} (vence ${toDelete.dueDate}). Recuperable.`
            : undefined
        }
        onConfirm={async () => {
          if (toDelete) {
            await deletePaymentAction(toDelete.id, clientId);
            onChanged();
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/** Inline edit for one payment row: amount, due date, method, status. dios/admin only. */
function PaymentEditForm({
  payment,
  onDone,
  onCancel,
}: {
  payment: ClientDetail["payments"][number];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await updatePaymentAction(prev, fd);
    if (res && "success" in res) onDone();
    return res;
  }, null);

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-sky-400/30 bg-white/5 p-4">
      <input type="hidden" name="paymentId" value={payment.id} />
      <input type="hidden" name="clientId" value={payment.clientId} />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={payment.amount}
          placeholder="Monto MXN"
          className={RELATED_FIELD}
        />
        <input name="dueDate" type="date" required defaultValue={payment.dueDate} className={RELATED_FIELD} />
        <input
          name="method"
          defaultValue={payment.method ?? ""}
          placeholder="Método (transferencia, tarjeta…)"
          className={RELATED_FIELD}
        />
        <select name="status" defaultValue={payment.status} className={RELATED_FIELD}>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>
      {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30"
        >
          Guardar cambios
        </button>
      </div>
    </form>
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
      <div className="mb-3">
        <SectionHeading icon={MessageSquare} title="Historial" tone="slate" />
      </div>

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
