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
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import {
  addHistoryEntryAction,
  createPlanAction,
  deleteClientAction,
  getClientDetail,
  markPaymentPaidAction,
  recordPaymentAction,
  updateClientBillingAction,
  updateClientStatusAction,
  type ClientBilling,
  type ClientDetail,
  type ClientStatus,
  type CrmActionState,
  type CrmClient,
} from "@/lib/crm/clients";
import { createProjectAction, type CrmProject } from "@/lib/crm/projects";
import type { CrmQuote } from "@/lib/crm/quotes";
import { createInvoiceAction, createInvoiceFromPaymentAction, type CrmInvoice } from "@/lib/crm/invoices";
import { createTaskAction, type CrmTask } from "@/lib/crm/tasks";
import type { CrmContract } from "@/lib/crm/contracts";
import { createExpenseAction, deleteExpenseAction } from "@/lib/crm/expenses";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type CrmExpense,
} from "@/lib/crm/expense-types";
import type { ItTicket } from "@/lib/it/ticket-types";
import type { ItAsset } from "@/lib/it/asset-types";
import { formatCurrencyMXN, initialsOf } from "@/lib/crm/format";
import { getDueDateUrgency } from "@/lib/crm/plan-status";
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
  expenses: CrmExpense[];
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

/** Section shell: back button, delete action, and the client's full breakdown. */
export default function ClientWorkspace({
  clientId,
  related,
  clients,
  serviceOptions,
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
  canWriteBilling,
  canReadBilling,
  canUseSupport,
  related,
  onChanged,
}: {
  detail: ClientDetail;
  clients: CrmClient[];
  serviceOptions: string[];
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

  const activeProjects = related.projects.filter((p) => p.status !== "completado").length;
  const openQuotes = related.quotes.filter((q) => q.status === "borrador" || q.status === "enviada").length;
  const overdue = payments.filter((p) => p.status === "vencido").reduce((s, p) => s + p.amount, 0);
  const cobrado = payments.filter((p) => p.status === "pagado").reduce((s, p) => s + p.amount, 0);
  const gastado = related.expenses.reduce((s, e) => s + e.amount, 0);
  const neto = cobrado - gastado;

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

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <DetailKpi icon={Briefcase} label="Proyectos activos" value={String(activeProjects)} tone="blue" />
          <DetailKpi icon={FileText} label="Cotizaciones abiertas" value={String(openQuotes)} tone="fuchsia" />
          <DetailKpi
            icon={AlertTriangle}
            label="Saldo vencido"
            value={overdue > 0 ? formatCurrencyMXN(overdue) : "Al día"}
            tone={overdue > 0 ? "rose" : "emerald"}
          />
          <DetailKpi icon={Wallet} label="Cobrado" value={formatCurrencyMXN(cobrado)} tone="emerald" />
          <DetailKpi icon={TrendingDown} label="Egresos" value={formatCurrencyMXN(gastado)} tone="rose" />
          <DetailKpi
            icon={Wallet}
            label="Neto"
            value={formatCurrencyMXN(neto)}
            tone={neto < 0 ? "rose" : "emerald"}
          />
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
      <ExpensesPanel
        clientId={client.id}
        plans={plans}
        payments={payments}
        expenses={related.expenses}
        cobrado={cobrado}
        onChanged={onChanged}
      />
      <RelatedPanels
        clientId={client.id}
        clients={clients}
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
  canWriteBilling,
  canReadBilling,
  canUseSupport,
  related,
  onChanged,
}: {
  clientId: string;
  clients: CrmClient[];
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
        <div>
          <div className="mb-3">
            <SectionHeading icon={ScrollText} title={`Servicios (${contracts.length})`} tone="cyan" />
          </div>
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
        </div>
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
          {payments.map((payment) => {
            const urgency = getDueDateUrgency(payment.dueDate);
            const invoice = invoices.find((i) => i.paymentId === payment.id);
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
                <div className="flex flex-wrap items-center gap-2">
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

                  {invoice ? (
                    <span className="flex items-center gap-1 rounded-full border border-teal-400/30 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-300">
                      <Receipt className="h-3.5 w-3.5" /> {invoice.number}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * The client's egresos with a running net (cobrado − gastado), an inline
 * "Nuevo egreso" form (optionally tied to a plan or the cobro it offsets),
 * and delete.
 */
function ExpensesPanel({
  clientId,
  plans,
  payments,
  expenses,
  cobrado,
  onChanged,
}: {
  clientId: string;
  plans: ClientDetail["plans"];
  payments: ClientDetail["payments"];
  expenses: CrmExpense[];
  cobrado: number;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CrmExpense | null>(null);
  const [state, formAction] = useActionState<CrmActionState, FormData>(async (prev, fd) => {
    const res = await createExpenseAction(prev, fd);
    if (res && "success" in res) {
      setOpen(false);
      router.refresh();
      onChanged();
    }
    return res;
  }, null);

  const gastado = expenses.reduce((s, e) => s + e.amount, 0);
  const neto = cobrado - gastado;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionHeading icon={TrendingDown} title={`Egresos (${expenses.length})`} tone="rose" />
        <PanelToggle open={open} onClick={() => setOpen((o) => !o)} label="Nuevo" />
      </div>

      <p className="mb-3 text-xs text-gray-400">
        Cobrado <span className="text-emerald-300">{formatCurrencyMXN(cobrado)}</span> − Egresos{" "}
        <span className="text-rose-300">{formatCurrencyMXN(gastado)}</span> = Neto{" "}
        <span className={neto < 0 ? "font-semibold text-rose-300" : "font-semibold text-emerald-300"}>
          {formatCurrencyMXN(neto)}
        </span>
      </p>

      {open && (
        <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <input type="hidden" name="clientId" value={clientId} />
          <input name="concept" required placeholder="Concepto (Hosting sitio web)" className={RELATED_FIELD} />
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
            <input name="expenseDate" type="date" className={RELATED_FIELD} />
            <select name="category" defaultValue="hosting" className={RELATED_FIELD}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input name="vendor" placeholder="Proveedor" className={RELATED_FIELD} />
            {plans.length > 0 && (
              <select name="planId" defaultValue="" className={RELATED_FIELD}>
                <option value="">Sin plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <select name="paymentId" defaultValue="" className={RELATED_FIELD}>
              <option value="">Sin cobro asociado</option>
              {payments.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatCurrencyMXN(p.amount)} · {p.dueDate}
                </option>
              ))}
            </select>
          </div>
          {state && "error" in state && <p className="text-xs text-red-400">{state.error}</p>}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-lg bg-rose-500/20 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/30"
          >
            Guardar egreso
          </button>
        </form>
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-gray-500">Sin egresos para este cliente.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/2 p-3"
            >
              <div>
                <p className="font-medium text-white">{e.concept}</p>
                <p className="text-xs text-gray-400">
                  {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category} · {e.expenseDate}
                  {e.vendor ? ` · ${e.vendor}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-300">−{formatCurrencyMXN(e.amount)}</span>
                <button
                  type="button"
                  onClick={() => setToDelete(e)}
                  aria-label="Eliminar egreso"
                  className="cursor-pointer rounded-full p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar egreso"
        body={toDelete ? `Se eliminará "${toDelete.concept}".` : undefined}
        onConfirm={async () => {
          if (toDelete) {
            await deleteExpenseAction(toDelete.id, clientId);
            router.refresh();
            onChanged();
          }
        }}
        onClose={() => setToDelete(null)}
      />
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
