"use client";

/**
 * Client-side shell for the CRM at `/admin`: renders the sidebar/mobile nav,
 * tracks which section is active, and mounts the corresponding section
 * component with the data `AdminPage` fetched server-side. Which nav items
 * and sections appear is decided per `role` (see `visibleSections`).
 */

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Activity,
  ArrowLeft,
  Briefcase,
  ChevronRight,
  FileText,
  HandCoins,
  Kanban,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Newspaper,
  Receipt,
  ScrollText,
  Server,
  Settings,
  TrendingDown,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";
import {
  assignableRoles,
  canManageAllUsers,
  canManageSettings,
  canReadBilling,
  canSeeMonitoring,
  canUseBlogModule,
  canUseCrmCore,
  canUseSupport,
  canWriteBilling,
  type Role,
} from "@/lib/auth/roles";
import IdleTimeout from "@/components/auth/IdleTimeout";
import DashboardUserCard from "@/components/dashboard/DashboardUserCard";
import UserManagement from "@/components/blog/dashboard/UserManagement";
import type { AssignableUser, ManagedUser } from "@/lib/auth/users";
import type { ManagedArticle } from "@/lib/blog/articles";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import type { CrmContact } from "@/lib/crm/contacts";
import type { CrmContract } from "@/lib/crm/contracts";
import type { CrmService } from "@/lib/crm/services";
import type { ServicePackage } from "@/lib/services/catalog";

/** Landing-catalog pricing for one offering, passed through to the Servicios tab. */
export type ServicePricing = { title: string; slug: string; packages: ServicePackage[] };
import type { CollectionItem, ClientHealth, PlanRow, ScheduledCharge } from "@/lib/crm/collections";
import type { CrmExpense } from "@/lib/crm/expenses";
import type { CrmProject } from "@/lib/crm/projects";
import type { CrmInvoice } from "@/lib/crm/invoices";
import type { CrmQuote } from "@/lib/crm/quotes";
import type { CrmTask } from "@/lib/crm/tasks";
import type { ItAsset } from "@/lib/it/asset-types";
import type { ItTicket } from "@/lib/it/ticket-types";
import type { ClientMonthUsage } from "@/lib/it/time-entries";
import type {
  ErrorStats,
  FailedLoginStats,
  MonitoringErrorEvent,
  SlowOperation,
  SlowPage,
  WebVitalSummary,
} from "@/lib/monitoring/queries";
import OverviewSection from "./crm/OverviewSection";
import ClientsSection from "./crm/ClientsSection";
import ProjectsSection from "./crm/ProjectsSection";
import InvoicesSection from "./crm/InvoicesSection";
import CobranzaSection from "./crm/CobranzaSection";
import ExpensesSection from "./crm/ExpensesSection";
import QuotesSection from "./crm/QuotesSection";
import ContractsSection from "./crm/ContractsSection";
import AssetsSection from "./it/AssetsSection";
import TicketsSection from "./it/TicketsSection";
import TasksSection from "./crm/TasksSection";
import BlogSection from "./crm/BlogSection";
import MonitoringSection from "./monitoring/MonitoringSection";
import SettingsSection, { type EnvStatus } from "./SettingsSection";
import type { AppSettings } from "@/lib/settings";

type Section =
  | "resumen"
  | "clientes"
  | "proyectos"
  | "facturacion"
  | "cobranza"
  | "egresos"
  | "cotizaciones"
  | "contratos"
  | "soporte"
  | "activos"
  | "tareas"
  | "blog"
  | "usuarios"
  | "monitoreo"
  | "configuracion";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "proyectos", label: "Proyectos", icon: Briefcase },
  { id: "facturacion", label: "Facturación", icon: Receipt },
  { id: "cobranza", label: "Cobranza", icon: HandCoins },
  { id: "egresos", label: "Egresos", icon: TrendingDown },
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "contratos", label: "Servicios", icon: ScrollText },
  { id: "soporte", label: "Soporte", icon: LifeBuoy },
  { id: "activos", label: "Activos", icon: Server },
  { id: "tareas", label: "Tareas", icon: Kanban },
  { id: "blog", label: "Blog", icon: Newspaper },
  { id: "usuarios", label: "Usuarios", icon: UserCog },
  { id: "monitoreo", label: "Monitoreo", icon: Activity },
];

/** Which nav sections a role sees, in nav order. */
function visibleSections(role: Role): Section[] {
  const out: Section[] = [];
  if (canUseCrmCore(role)) out.push("resumen", "clientes", "proyectos");
  if (canReadBilling(role)) out.push("facturacion", "cobranza", "egresos");
  if (canUseCrmCore(role)) out.push("cotizaciones");
  if (canReadBilling(role)) out.push("contratos");
  if (canUseSupport(role)) out.push("soporte", "activos");
  out.push("tareas");
  if (canUseBlogModule(role)) out.push("blog");
  if (canManageAllUsers(role)) out.push("usuarios");
  if (canSeeMonitoring(role)) out.push("monitoreo");
  return out;
}

/**
 * CRM dashboard shell: sidebar navigation, mobile header/quick-nav, and the
 * active section's content area. `role` decides which of the nine modules
 * appear (see `visibleSections`) and whether Facturación is read-only.
 */
export default function CrmDashboard({
  email,
  userName = "",
  userId = "",
  role,
  users = [],
  blogUsers = [],
  assignees = [],
  blogArticles = [],
  projectOptions = [],
  clients = [],
  payments = [],
  projects = [],
  invoices = [],
  quotes = [],
  collections = [],
  scheduledCharges = [],
  plans = [],
  expenses = [],
  clientHealth = {},
  assets = [],
  tickets = [],
  contacts = [],
  contracts = [],
  services = [],
  catalogServiceNames = [],
  servicePricing = [],
  contractUsage = {},
  appSettings = null,
  envStatus = { resend: false, cron: false, fromEmail: false, twilio: false },
  tasks,
  recentErrors = [],
  errorStats = { daily: [], last24h: 0, last7d: 0 },
  webVitals = [],
  slowOperations = [],
  slowPages = [],
  failedLogins = { last24h: 0, last7d: 0, recent: [] },
}: {
  email: string;
  userName?: string;
  userId?: string;
  role: Role;
  users?: ManagedUser[];
  blogUsers?: ManagedUser[];
  assignees?: AssignableUser[];
  blogArticles?: ManagedArticle[];
  projectOptions?: { id: string; name: string }[];
  clients?: CrmClient[];
  payments?: ClientPayment[];
  projects?: CrmProject[];
  invoices?: CrmInvoice[];
  quotes?: CrmQuote[];
  collections?: CollectionItem[];
  scheduledCharges?: ScheduledCharge[];
  plans?: PlanRow[];
  expenses?: CrmExpense[];
  clientHealth?: Record<string, ClientHealth>;
  assets?: ItAsset[];
  tickets?: ItTicket[];
  contacts?: CrmContact[];
  contracts?: CrmContract[];
  services?: CrmService[];
  /** Offering names from the public landing catalog, suggested in the client form. */
  catalogServiceNames?: string[];
  /** Landing-catalog pricing (packages per offering), shown in the Servicios tab. */
  servicePricing?: ServicePricing[];
  contractUsage?: Record<string, ClientMonthUsage>;
  appSettings?: AppSettings | null;
  envStatus?: EnvStatus;
  tasks: CrmTask[];
  recentErrors?: MonitoringErrorEvent[];
  errorStats?: ErrorStats;
  webVitals?: WebVitalSummary[];
  slowOperations?: SlowOperation[];
  slowPages?: SlowPage[];
  failedLogins?: FailedLoginStats;
}) {
  const allowed = visibleSections(role);
  const navItems = NAV_ITEMS.filter((n) => allowed.includes(n.id));
  const [section, setSection] = useState<Section>(navItems[0]?.id ?? "tareas");
  const [history, setHistory] = useState<Section[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /** True when `id` is a section this role may open. */
  const isReachable = (id: string): id is Section =>
    id === "configuracion" ? canManageSettings(role) : navItems.some((n) => n.id === id);

  // Restore the section from the URL hash on load, so a refresh stays put.
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fromHash && isReachable(fromHash)) setSection(fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the hash in sync with the active section (no history entry).
  useEffect(() => {
    window.history.replaceState(null, "", `#${section}`);
  }, [section]);

  /** Navigate to a section, remembering where we came from (for the back button). */
  const go = (next: Section) => {
    setSidebarOpen(false);
    if (next === section) return;
    setHistory((h) => [...h, section]);
    setSection(next);
  };

  /** Step back to the previously visited section. */
  const goBack = () => {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (prev) setSection(prev);
      return h.slice(0, -1);
    });
  };

  const currentLabel =
    section === "configuracion"
      ? "Configuración"
      : (navItems.find((n) => n.id === section)?.label ?? navItems[0]?.label ?? "Panel");

  const CurrentIcon =
    section === "configuracion"
      ? Settings
      : (navItems.find((n) => n.id === section)?.icon ?? LayoutDashboard);

  const navButtonClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-linear-to-r from-sky-500/25 to-purple-500/15 text-white ring-1 ring-sky-400/20"
        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
    }`;

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-2 py-1">
        <Image
          src="/img/logos/techplace-icon.webp"
          alt="TechPlace"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full"
        />
        <div>
          <p className="text-sm font-bold leading-tight text-white">TechPlace</p>
          <p className="text-xs leading-tight text-sky-300">CRM</p>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            aria-current={section === item.id ? "page" : undefined}
            className={navButtonClass(section === item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-8 space-y-2 border-t border-white/10 pt-4">
        {canManageSettings(role) && (
          <button
            type="button"
            onClick={() => go("configuracion")}
            aria-current={section === "configuracion" ? "page" : undefined}
            className={navButtonClass(section === "configuracion")}
          >
            <Settings className="h-4 w-4" />
            Configuración
          </button>
        )}
        <DashboardUserCard name={userName} email={email} redirectTo="/login" />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_12%_-8%,rgba(147,51,234,0.16),transparent_42%),radial-gradient(circle_at_108%_6%,rgba(56,189,248,0.13),transparent_40%),linear-gradient(to_bottom_right,#0a1420,#0c1522,#05040c)] text-white">
      <IdleTimeout redirectTo="/login" />
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-white/10 lg:bg-black/30 lg:p-5 lg:backdrop-blur-md">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[80vw] flex-col border-r border-white/10 bg-[#0a0e14] p-5">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-4 top-4 -m-2 p-2 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-black/25 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-3 -m-1.5 text-gray-300 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Image
              src="/img/logos/techplace-icon.webp"
              alt="TechPlace"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full lg:hidden"
            />
            <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-sm lg:hidden">
              <button
                type="button"
                onClick={() => go(navItems[0]?.id ?? "tareas")}
                className="shrink-0 cursor-pointer text-gray-500 hover:text-gray-300"
              >
                CRM
              </button>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-600" />
              <span className="truncate font-bold text-white">{currentLabel}</span>
            </nav>

            <form action={logout} className="ml-auto">
              <input type="hidden" name="redirectTo" value="/login" />
              <button
                type="submit"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>

          {/* Mobile quick-nav: every section at a glance, horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 sm:px-6 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                aria-current={section === item.id ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  section === item.id
                    ? "border-sky-400/40 bg-sky-500/15 text-white"
                    : "border-white/10 text-gray-400 hover:text-gray-200"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10">
          <div>
            <nav
              aria-label="Ruta de navegación"
              className="mb-2 flex items-center gap-1.5 text-xs text-gray-500"
            >
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Regresar"
                  title="Regresar"
                  className="-ml-1 flex cursor-pointer items-center rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => go(navItems[0]?.id ?? "tareas")}
                className="cursor-pointer transition-colors hover:text-gray-300"
              >
                CRM
              </button>
              <ChevronRight className="h-3 w-3 shrink-0 text-gray-600" />
              <span className="font-medium text-gray-300">{currentLabel}</span>
            </nav>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300 sm:h-9 sm:w-9">
                <CurrentIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <h1 className="font-heading text-xl font-extrabold tracking-tight sm:text-3xl">
                {currentLabel}
              </h1>
            </div>
          </div>

          {section === "resumen" && allowed.includes("resumen") && (
            <OverviewSection
              clients={clients}
              projects={projects}
              payments={payments}
              expenses={expenses}
              scheduledCharges={scheduledCharges}
              tasks={tasks}
              tickets={tickets}
            />
          )}
          {section === "clientes" && allowed.includes("clientes") && (
            <ClientsSection
              clients={clients}
              health={clientHealth}
              projects={projects}
              quotes={quotes}
              invoices={invoices}
              tasks={tasks}
              contracts={contracts}
              tickets={tickets}
              assets={assets}
              plans={plans}
              catalogServices={services}
              serviceOptions={[
                ...new Set([
                  ...catalogServiceNames,
                  ...services.filter((s) => s.active).map((s) => s.name),
                ]),
              ]}
              canWriteBilling={canWriteBilling(role)}
              canReadBilling={canReadBilling(role)}
              canUseSupport={canUseSupport(role)}
            />
          )}
          {section === "proyectos" && allowed.includes("proyectos") && (
            <ProjectsSection projects={projects} clients={clients} />
          )}
          {section === "facturacion" && allowed.includes("facturacion") && (
            <InvoicesSection
              invoices={invoices}
              clients={clients}
              projects={projects}
              readOnly={!canWriteBilling(role)}
            />
          )}
          {section === "cobranza" && allowed.includes("cobranza") && (
            <CobranzaSection
              collections={collections}
              scheduledCharges={scheduledCharges}
              clients={clients.map((c) => ({ id: c.id, name: c.company }))}
              invoices={invoices}
            />
          )}
          {section === "egresos" && allowed.includes("egresos") && (
            <ExpensesSection
              expenses={expenses}
              clients={clients.map((c) => ({ id: c.id, name: c.company }))}
              payments={payments.map((p) => ({ id: p.id, dueDate: p.dueDate, amount: p.amount }))}
            />
          )}
          {section === "cotizaciones" && allowed.includes("cotizaciones") && (
            <QuotesSection quotes={quotes} clients={clients} catalogServices={services} />
          )}
          {section === "contratos" && allowed.includes("contratos") && (
            <ContractsSection
              contracts={contracts}
              services={services}
              plans={plans}
              servicePricing={servicePricing}
              usageByClient={contractUsage}
              clients={clients.map((c) => ({ id: c.id, name: c.company }))}
            />
          )}
          {section === "soporte" && allowed.includes("soporte") && (
            <TicketsSection
              tickets={tickets}
              clients={clients.map((c) => ({ id: c.id, name: c.company }))}
              assignees={assignees}
              contacts={contacts.map((c) => ({ id: c.id, name: c.name, clientId: c.clientId }))}
              assets={assets.map((a) => ({ id: a.id, name: a.name, clientId: a.clientId }))}
              currentUserId={userId}
            />
          )}
          {section === "activos" && allowed.includes("activos") && (
            <AssetsSection
              assets={assets}
              clients={clients.map((c) => ({ id: c.id, name: c.company }))}
            />
          )}
          {section === "tareas" && (
            <TasksSection
              tasks={tasks}
              projects={projectOptions}
              clientOptions={clients.map((c) => ({ id: c.id, name: c.company }))}
              assignees={assignees}
              currentUserId={userId}
              defaultView={canUseCrmCore(role) ? "proyecto" : "mias"}
              canPickAnyProject={canUseCrmCore(role)}
            />
          )}
          {section === "blog" && allowed.includes("blog") && (
            <BlogSection
              role={role}
              articles={blogArticles}
              users={blogUsers}
              authorEmail={email}
              currentUserId={userId}
            />
          )}
          {section === "usuarios" && allowed.includes("usuarios") && (
            <UserManagement
              currentUserId={userId}
              initialUsers={users}
              assignableRoles={assignableRoles(role)}
            />
          )}
          {section === "monitoreo" && allowed.includes("monitoreo") && (
            <MonitoringSection
              recentErrors={recentErrors}
              errorStats={errorStats}
              webVitals={webVitals}
              slowOperations={slowOperations}
              slowPages={slowPages}
              failedLogins={failedLogins}
            />
          )}
          {section === "configuracion" && canManageSettings(role) && appSettings && (
            <SettingsSection settings={appSettings} env={envStatus} />
          )}
        </main>
      </div>
    </div>
  );
}
