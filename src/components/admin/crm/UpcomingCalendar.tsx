"use client";

/**
 * Month calendar for the Resumen: plots upcoming cobros, tareas, proyectos y
 * SLAs de soporte on a blueprint-style grid. Purely informational (no
 * navigation) — fed a flat `events` list by `OverviewSection`.
 */

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export type CalEventKind = "cobro" | "tarea" | "proyecto" | "soporte";

export type CalEvent = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  kind: CalEventKind;
  label: string;
  sub?: string;
};

const KIND_META: Record<CalEventKind, { dot: string; chip: string; name: string }> = {
  cobro: { dot: "bg-emerald-400", chip: "border-emerald-400/50 bg-emerald-500/10 text-emerald-200", name: "Cobros" },
  tarea: { dot: "bg-indigo-400", chip: "border-indigo-400/50 bg-indigo-500/10 text-indigo-200", name: "Tareas" },
  proyecto: { dot: "bg-violet-400", chip: "border-violet-400/50 bg-violet-500/10 text-violet-200", name: "Proyectos" },
  soporte: { dot: "bg-rose-400", chip: "border-rose-400/50 bg-rose-500/10 text-rose-200", name: "Soporte (SLA)" },
};

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Local YYYY-MM-DD for a Date. */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function UpcomingCalendar({ events }: { events: CalEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) continue;
      const arr = m.get(e.date);
      if (arr) arr.push(e);
      else m.set(e.date, [e]);
    }
    for (const list of m.values()) list.sort((a, b) => a.kind.localeCompare(b.kind));
    return m;
  }, [events]);

  const { cells, monthCount } = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // days since Monday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = Math.ceil((startOffset + daysInMonth) / 7);
    const gridStart = new Date(year, month, 1 - startOffset);
    const cells = Array.from({ length: rows * 7 }, (_, i) => {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      return { d, key: iso(d), inMonth: d.getMonth() === month };
    });
    const monthCount = events.filter((e) =>
      e.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
    ).length;
    return { cells, monthCount };
  }, [year, month, events]);

  const todayKey = iso(today);
  const step = (n: number) => setCursor(new Date(year, month + n, 1));

  return (
    <div className="tp-dark-card-crm rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
            <CalendarDays className="h-4 w-4" />
          </span>
          Agenda
          <span className="font-mono text-xs font-normal text-gray-500">
            {monthCount} evento{monthCount === 1 ? "" : "s"}
          </span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Mes anterior"
            className="cursor-pointer rounded-md border border-white/10 p-1.5 text-gray-400 hover:border-sky-400/40 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-40 text-center font-mono text-sm font-semibold uppercase tracking-widest text-gray-200">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Mes siguiente"
            className="cursor-pointer rounded-md border border-white/10 p-1.5 text-gray-400 hover:border-sky-400/40 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="ml-1 cursor-pointer rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-gray-400 hover:border-sky-400/40 hover:text-white"
          >
            Hoy
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-140">
          <div className="grid grid-cols-7 border border-white/10 bg-white/2">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="border-b border-white/10 px-2 py-1.5 text-center font-mono text-[10px] font-semibold tracking-widest text-gray-500"
              >
                {w}
              </div>
            ))}

            {cells.map(({ d, key, inMonth }) => {
              const list = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`min-h-21.5 border-b border-r border-white/6 p-1.5 last:border-r-0 ${
                    inMonth ? "" : "bg-black/20"
                  } ${isToday ? "ring-1 ring-inset ring-sky-400/60" : ""}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        isToday
                          ? "rounded bg-sky-500/20 px-1 font-bold text-sky-200"
                          : inMonth
                            ? "text-gray-400"
                            : "text-gray-700"
                      }`}
                    >
                      {String(d.getDate()).padStart(2, "0")}
                    </span>
                    {list.length > 0 && (
                      <span className="font-mono text-[9px] text-gray-600">{list.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {list.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        title={`${e.label}${e.sub ? ` · ${e.sub}` : ""}`}
                        className={`truncate border-l-2 px-1 py-0.5 text-[10px] leading-tight ${KIND_META[e.kind].chip}`}
                      >
                        {e.label}
                        {e.sub ? <span className="text-gray-400"> · {e.sub}</span> : null}
                      </div>
                    ))}
                    {list.length > 3 && (
                      <div className="px-1 font-mono text-[9px] text-gray-500">+{list.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {(Object.keys(KIND_META) as CalEventKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
            <span className={`h-2 w-2 ${KIND_META[k].dot}`} />
            {KIND_META[k].name}
          </span>
        ))}
      </div>
    </div>
  );
}
