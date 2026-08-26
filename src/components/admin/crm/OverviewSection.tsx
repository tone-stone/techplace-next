import { Briefcase, HandCoins, TrendingUp, Users } from "lucide-react";
import type { ClientPayment, CrmClient } from "@/lib/crm/clients";
import { formatCurrencyMXN, type Project } from "@/lib/crm/mock-data";
import StatusBadge from "./StatusBadge";

export default function OverviewSection({
  clients,
  projects,
  payments,
}: {
  clients: CrmClient[];
  projects: Project[];
  payments: ClientPayment[];
}) {
  const now = new Date();
  const activeClients = clients.filter((c) => c.status === "activo").length;
  const activeProjects = projects.filter((p) => p.status !== "completado").length;

  const monthlyRevenue = payments
    .filter((p) => {
      if (p.status !== "pagado" || !p.paidDate) return false;
      const paid = new Date(`${p.paidDate}T00:00:00`);
      return paid.getFullYear() === now.getFullYear() && paid.getMonth() === now.getMonth();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter((p) => p.status === "pendiente" || p.status === "vencido")
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    { label: "Clientes activos", value: activeClients, icon: Users },
    { label: "Proyectos en curso", value: activeProjects, icon: Briefcase },
    { label: "Cobrado este mes", value: formatCurrencyMXN(monthlyRevenue), icon: TrendingUp },
    { label: "Por cobrar", value: formatCurrencyMXN(pendingRevenue), icon: HandCoins },
  ];

  const recentProjects = [...projects].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="tp-dark-card-crm flex items-center gap-4 rounded-2xl p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-500/10">
              <stat.icon className="h-5 w-5 text-sky-300" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Próximas entregas</h2>
        <div className="space-y-3">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{project.name}</p>
                <p className="text-xs text-gray-400">{project.client}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-sky-400" style={{ width: `${project.progress}%` }} />
                </div>
                <StatusBadge status={project.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
