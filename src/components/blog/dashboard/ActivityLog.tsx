"use client";

import { History } from "lucide-react";
import type { ActivityAction, ActivityEntry } from "./types";

const DOT_COLOR: Record<ActivityAction, string> = {
  creó: "bg-emerald-400",
  editó: "bg-amber-400",
  eliminó: "bg-red-400",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="tp-dark-card-admin rounded-3xl p-6 sm:p-8">
      <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
        <History className="h-5 w-5 text-purple-300" /> Historial de actividad
      </h2>

      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/2 p-3"
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[entry.action]}`} />
            <div className="min-w-0">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">{entry.actor}</span> {entry.action}{" "}
                <span className="text-gray-200">&ldquo;{entry.title}&rdquo;</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{timeAgo(entry.timestamp)}</p>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">Sin actividad todavía.</p>
        )}
      </div>
    </div>
  );
}
