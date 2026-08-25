import {
  BrainCircuit,
  Network,
  Server,
  ShieldCheck,
  Smartphone,
  SquareCode,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Ciberseguridad: ShieldCheck,
  "Desarrollo Web": SquareCode,
  "Desarrollo Móvil": Smartphone,
  "Inteligencia Artificial": BrainCircuit,
  "Hosting & Infraestructura": Server,
  "Consultoría IT": Network,
};

export const CATEGORIES = Object.keys(CATEGORY_ICONS);

export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
