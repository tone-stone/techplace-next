"use client";

/**
 * Signed-in account strip shared by every dashboard shell (CRM `/admin`,
 * blog admin, blog redactor). Shows an initials avatar, the account name
 * with its email underneath, and a "Salir" button that posts to the
 * `logout` server action. Lives in the sidebar footer on the shells that
 * have a sidebar (so it also shows in the mobile drawer, which renders the
 * same content) and in the header on the redactor view, which has none.
 */

import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth/actions";

/** "María López" -> "ML"; falls back to the email local-part, then "?". */
function toInitials(name: string, email: string): string {
  const base = name.trim() || email.split("@")[0] || "?";
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DashboardUserCard({
  name,
  email,
  redirectTo = "/login",
  className = "",
}: {
  name: string;
  email: string;
  /** Where `logout` sends the user afterwards. `/blog/login` for the blog shells. */
  redirectTo?: string;
  className?: string;
}) {
  const displayName = name.trim() || email.split("@")[0] || "Usuario";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-500/30 to-purple-500/25 text-xs font-bold text-white ring-1 ring-white/15"
      >
        {toInitials(name, email)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white" title={displayName}>
          {displayName}
        </p>
        <p className="truncate text-xs text-gray-400" title={email}>
          {email}
        </p>
      </div>

      <form action={logout} className="shrink-0">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </form>
    </div>
  );
}
