/**
 * Renders a colored pill for any CRM status value — client, project,
 * invoice, quote, or task status all share this one component. Styles and
 * Spanish labels are looked up by raw status string, so it works across
 * every entity's status enum without per-type variants.
 */

const STYLES: Record<string, string> = {
  // clientes
  lead: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  negociacion: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  activo: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  inactivo: "border-gray-400/30 bg-gray-500/10 text-gray-400",
  // proyectos
  planeacion: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  en_progreso: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  revision: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  completado: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  // facturas
  borrador: "border-gray-400/30 bg-gray-500/10 text-gray-400",
  enviada: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  pagada: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  vencida: "border-red-400/30 bg-red-500/10 text-red-300",
  // cotizaciones
  aceptada: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  rechazada: "border-red-400/30 bg-red-500/10 text-red-300",
  // tareas
  por_hacer: "border-gray-400/30 bg-gray-500/10 text-gray-400",
  terminado: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
};

const LABELS: Record<string, string> = {
  lead: "Lead",
  negociacion: "En negociación",
  activo: "Activo",
  inactivo: "Inactivo",
  planeacion: "Planeación",
  en_progreso: "En progreso",
  revision: "En revisión",
  completado: "Completado",
  borrador: "Borrador",
  enviada: "Enviada",
  pagada: "Pagada",
  vencida: "Vencida",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  por_hacer: "Por hacer",
  terminado: "Terminado",
};

/**
 * @param status - Any raw status value from a CRM entity (client, project,
 * invoice, quote, or task). Unrecognized values fall back to a neutral style
 * and the raw string as the label.
 */
export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
        STYLES[status] ?? "border-white/10 bg-white/5 text-gray-300"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
