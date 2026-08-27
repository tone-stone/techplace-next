"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  ChevronRight,
  FileText,
  Kanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";
import IdleTimeout from "@/components/auth/IdleTimeout";
import UserManagement from "@/components/blog/dashboard/UserManagement";
import type { ManagedUser } from "@/lib/auth/users";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import type { CrmProject } from "@/lib/crm/projects";
import type { CrmInvoice } from "@/lib/crm/invoices";
import type { CrmQuote } from "@/lib/crm/quotes";
import type { CrmTask } from "@/lib/crm/tasks";
import OverviewSection from "./crm/OverviewSection";
import ClientsSection from "./crm/ClientsSection";
import ProjectsSection from "./crm/ProjectsSection";
import InvoicesSection from "./crm/InvoicesSection";
import QuotesSection from "./crm/QuotesSection";
import TasksSection from "./crm/TasksSection";

type Section =
  | "resumen"
  | "clientes"
  | "proyectos"
  | "facturacion"
  | "cotizaciones"
  | "tareas"
  | "usuarios";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "proyectos", label: "Proyectos", icon: Briefcase },
  { id: "facturacion", label: "Facturación", icon: Receipt },
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "tareas", label: "Tareas", icon: Kanban },
  { id: "usuarios", label: "Usuarios", icon: UserCog },
];

export default function CrmDashboard({
  email,
  userId = "",
  users = [],
  clients,
  payments,
  projects,
  invoices,
  quotes,
  tasks,
}: {
  email: string;
  userId?: string;
  users?: ManagedUser[];
  clients: CrmClient[];
  payments: ClientPayment[];
  projects: CrmProject[];
  invoices: CrmInvoice[];
  quotes: CrmQuote[];
  tasks: CrmTask[];
}) {
  const [section, setSection] = useState<Section>("resumen");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLabel = NAV_ITEMS.find((n) => n.id === section)?.label ?? "Resumen";

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
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSection(item.id);
              setSidebarOpen(false);
            }}
            className={navButtonClass(section === item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-5">
        <p className="truncate px-1 text-xs text-gray-400">{email}</p>
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
              <span className="shrink-0 text-gray-500">CRM</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-600" />
              <span className="truncate font-bold text-white">{currentLabel}</span>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <form action={logout}>
                <input type="hidden" name="redirectTo" value="/login" />
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-gray-300 transition-colors hover:border-red-400/40 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Mobile quick-nav: every section at a glance, horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 sm:px-6 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
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
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 shrink-0 text-sky-300 sm:h-6 sm:w-6" />
            <h1 className="font-heading text-xl font-extrabold tracking-tight sm:text-3xl">
              {currentLabel}
            </h1>
          </div>

          {section === "resumen" && (
            <OverviewSection clients={clients} projects={projects} payments={payments} />
          )}
          {section === "clientes" && <ClientsSection clients={clients} />}
          {section === "proyectos" && <ProjectsSection projects={projects} clients={clients} />}
          {section === "facturacion" && (
            <InvoicesSection invoices={invoices} clients={clients} projects={projects} />
          )}
          {section === "cotizaciones" && <QuotesSection quotes={quotes} clients={clients} />}
          {section === "tareas" && <TasksSection tasks={tasks} projects={projects} />}
          {section === "usuarios" && (
            <UserManagement currentUserId={userId} initialUsers={users} accent="sky" />
          )}
        </main>
      </div>
    </div>
  );
}
