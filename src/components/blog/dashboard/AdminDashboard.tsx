"use client";

/**
 * Full admin view of the blog dashboard: sidebar navigation between
 * Artículos/Usuarios/Actividad sections, article create/edit/delete, the
 * blog-scoped user management panel (`UserManagement` with `scope="blog"`),
 * and the activity log. Rendered by `DashboardClient` for accounts with
 * admin-level access (blog admins and the CRM general admin).
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  History,
  LayoutDashboard,
  Menu,
  LogOut,
  Newspaper,
  Tags,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";
import IdleTimeout from "@/components/auth/IdleTimeout";
import { CATEGORIES } from "@/lib/blog-posts";
import type { ManagedArticle } from "@/lib/blog/articles";
import type { ManagedUser } from "@/lib/auth/users";
import ArticleForm from "./ArticleForm";
import ArticleList from "./ArticleList";
import ActivityLog from "./ActivityLog";
import UserManagement from "./UserManagement";
import RolePreviewSwitch from "./RolePreviewSwitch";
import type { ActivityEntry, DashboardRole } from "./types";

type Section = "articles" | "users" | "activity";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Newspaper }[] = [
  { id: "articles", label: "Artículos", icon: Newspaper },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "activity", label: "Actividad", icon: History },
];

/**
 * Renders the admin dashboard shell (sidebar + header) and swaps between
 * the articles, users, and activity sections.
 *
 * @param canPreview - Whether the role-preview switch is shown, letting a
 * real admin temporarily view the dashboard as a redactor would see it.
 * @param onRoleChange - Callback invoked when the admin toggles the preview
 * role.
 * @param onSaved - Callback invoked after an article is created or updated,
 * used to log the action and exit edit mode.
 */
export default function AdminDashboard({
  email,
  userId,
  initialUsers,
  role,
  canPreview,
  onRoleChange,
  articles,
  activity,
  editingId,
  editingArticle,
  onSaved,
  onCancelEdit,
  onEdit,
  onDelete,
}: {
  email: string;
  userId: string;
  initialUsers: ManagedUser[];
  role: DashboardRole;
  canPreview: boolean;
  onRoleChange: (role: DashboardRole) => void;
  articles: ManagedArticle[];
  activity: ActivityEntry[];
  editingId: string | null;
  editingArticle: ManagedArticle | null;
  onSaved: (title: string, mode: "creó" | "editó") => void;
  onCancelEdit: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [section, setSection] = useState<Section>("articles");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { label: "Artículos", value: articles.length, icon: Newspaper },
    { label: "Categorías", value: CATEGORIES.length, icon: Tags },
    { label: "Borradores", value: articles.filter((a) => a.status === "draft").length, icon: FileText },
  ];

  const navButtonClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-purple-500/20 text-white"
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
          <p className="text-xs leading-tight text-purple-300">Panel de Administrador</p>
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
        {canPreview && <RolePreviewSwitch role={role} onChange={onRoleChange} compact />}
        <div className="px-1">
          <p className="truncate text-xs text-gray-400">{email}</p>
        </div>
        <Link
          href="/blog"
          className="block rounded-full border border-white/10 px-3 py-2 text-center text-xs text-gray-300 transition-colors hover:border-purple-400/40 hover:text-purple-300"
        >
          Ver blog
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-linear-to-br from-[#160a1f] via-[#150c1e] to-[#05040c] text-white">
      <IdleTimeout redirectTo="/blog/login" />
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
          <aside className="relative z-10 flex h-full w-72 max-w-[80vw] flex-col border-r border-white/10 bg-[#0c0714] p-5">
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-black/25 px-4 py-3.5 backdrop-blur-md sm:px-6">
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
          <p className="text-sm font-bold text-white lg:hidden">Panel de Administrador</p>

          <div className="ml-auto flex items-center gap-3">
            <form action={logout}>
              <input type="hidden" name="redirectTo" value="/blog/login" />
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
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6 hidden items-center gap-2 lg:flex">
            <LayoutDashboard className="h-6 w-6 text-purple-300" />
            <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              {NAV_ITEMS.find((n) => n.id === section)?.label}
            </h1>
          </div>

          {section === "articles" && (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="tp-dark-card-admin flex items-center gap-4 rounded-2xl p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-500/10">
                      <stat.icon className="h-5 w-5 text-purple-300" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <ArticleForm
                    key={editingArticle?.id ?? "new"}
                    editingArticle={editingArticle}
                    defaultAuthor={email}
                    role="admin"
                    onSaved={onSaved}
                    onCancelEdit={onCancelEdit}
                  />
                </div>
                <div className="lg:col-span-3">
                  <ArticleList
                    articles={articles}
                    editingId={editingId}
                    canDelete
                    role="admin"
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </>
          )}

          {section === "users" && (
            <UserManagement
              currentUserId={userId}
              initialUsers={initialUsers}
              scope="blog"
              accent="purple"
            />
          )}

          {section === "activity" && <ActivityLog entries={activity} />}
        </main>
      </div>
    </div>
  );
}
