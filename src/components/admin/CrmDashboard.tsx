"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import { MOCK_INVOICES, MOCK_PROJECTS } from "@/lib/crm/mock-data";
import OverviewSection from "./crm/OverviewSection";
import ClientsSection from "./crm/ClientsSection";
import ProjectsSection from "./crm/ProjectsSection";
import InvoicesSection from "./crm/InvoicesSection";

type Section = "resumen" | "clientes" | "proyectos" | "facturacion";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "proyectos", label: "Proyectos", icon: Briefcase },
  { id: "facturacion", label: "Facturación", icon: Receipt },
];

export default function CrmDashboard({
  email,
  clients,
  payments,
}: {
  email: string;
  clients: CrmClient[];
  payments: ClientPayment[];
}) {
  const [section, setSection] = useState<Section>("resumen");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navButtonClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-sky-500/20 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
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

      <div className="mt-8 space-y-4 border-t border-white/10 pt-5">
        <div className="px-1">
          <p className="truncate text-xs text-gray-400">{email}</p>
        </div>
        <form action={logout}>
          <input type="hidden" name="redirectTo" value="/login" />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-gray-300 transition-colors hover:border-red-400/40 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-linear-to-br from-[#0a1420] via-[#0c1522] to-[#05040c] text-white">
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-4 backdrop-blur-md sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="rounded-lg p-3 -m-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Image
            src="/img/logos/techplace-icon.webp"
            alt="TechPlace"
            width={28}
            height={28}
            className="h-7 w-7 rounded-full"
          />
          <p className="text-sm font-bold text-white">CRM TechPlace</p>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10">
          <div className="hidden items-center gap-2 lg:flex">
            <LayoutDashboard className="h-6 w-6 text-sky-300" />
            <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              {NAV_ITEMS.find((n) => n.id === section)?.label}
            </h1>
          </div>

          {section === "resumen" && (
            <OverviewSection clients={clients} projects={MOCK_PROJECTS} payments={payments} />
          )}
          {section === "clientes" && <ClientsSection clients={clients} />}
          {section === "proyectos" && <ProjectsSection projects={MOCK_PROJECTS} />}
          {section === "facturacion" && <InvoicesSection invoices={MOCK_INVOICES} />}
        </main>
      </div>
    </div>
  );
}
