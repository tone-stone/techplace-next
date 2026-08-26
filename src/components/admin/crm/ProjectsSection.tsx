import { Calendar } from "lucide-react";
import { formatCurrencyMXN, type Project } from "@/lib/crm/mock-data";
import StatusBadge from "./StatusBadge";

export default function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-bold text-white">Proyectos ({projects.length})</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <div key={project.id} className="rounded-xl border border-white/5 bg-white/2 p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{project.name}</p>
                <p className="text-xs text-gray-400">{project.client}</p>
              </div>
              <StatusBadge status={project.status} />
            </div>

            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-sky-400" style={{ width: `${project.progress}%` }} />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Entrega {project.dueDate}
              </span>
              <span className="font-semibold text-gray-300">{formatCurrencyMXN(project.budget)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
