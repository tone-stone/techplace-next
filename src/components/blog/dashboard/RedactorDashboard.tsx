"use client";

/**
 * Redactor-level view of the blog dashboard: a single-page layout for
 * creating/editing articles, with no delete button and no user-management
 * access. Rendered by `DashboardClient` for redactor accounts, or by an
 * admin using the role-preview switch.
 */

import Image from "next/image";
import Link from "next/link";
import { FileText, LayoutDashboard, LogOut, Newspaper, Tags } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import IdleTimeout from "@/components/auth/IdleTimeout";
import { CATEGORIES } from "@/lib/blog-posts";
import type { ManagedArticle } from "@/lib/blog/articles";
import ArticleForm from "./ArticleForm";
import ArticleList from "./ArticleList";
import RolePreviewSwitch from "./RolePreviewSwitch";
import type { DashboardRole } from "./types";

/**
 * Renders the redactor dashboard header, stats, and the article
 * form/list pair.
 *
 * @param canPreview - Whether the role-preview switch is shown (true only
 * when a real admin is previewing this view).
 */
export default function RedactorDashboard({
  email,
  role,
  canPreview,
  onRoleChange,
  articles,
  editingId,
  editingArticle,
  onSaved,
  onCancelEdit,
  onEdit,
}: {
  email: string;
  role: DashboardRole;
  canPreview: boolean;
  onRoleChange: (role: DashboardRole) => void;
  articles: ManagedArticle[];
  editingId: string | null;
  editingArticle: ManagedArticle | null;
  onSaved: (title: string, mode: "creó" | "editó") => void;
  onCancelEdit: () => void;
  onEdit: (id: string) => void;
}) {
  const stats = [
    { label: "Artículos", value: articles.length, icon: Newspaper },
    { label: "Categorías", value: CATEGORIES.length, icon: Tags },
    { label: "Borradores", value: articles.filter((a) => a.status === "draft").length, icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0a1a] via-[#0d0c1c] to-[#05040c] text-white">
      <IdleTimeout redirectTo="/blog/login" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logos/techplace-icon.webp"
              alt="TechPlace"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
            />
            <div>
              <p className="text-sm font-bold leading-tight">TechPlace</p>
              <p className="text-xs leading-tight text-indigo-300">Portal de Redacción</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden text-sm text-gray-400 md:inline">{email}</span>
            <Link href="/blog" className="text-sm text-gray-400 transition-colors hover:text-indigo-300">
              Ver blog
            </Link>
            <form action={logout}>
              <input type="hidden" name="redirectTo" value="/blog/login" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-red-400/40 hover:text-red-300 sm:px-4"
              >
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-indigo-300" />
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Mis artículos</h1>
        </div>

        {canPreview && <RolePreviewSwitch role={role} onChange={onRoleChange} />}

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="tp-dark-card flex items-center gap-4 rounded-2xl p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
                <stat.icon className="h-5 w-5 text-indigo-300" />
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
              role="redactor"
              onSaved={onSaved}
              onCancelEdit={onCancelEdit}
            />
          </div>
          <div className="lg:col-span-3">
            <ArticleList
              articles={articles}
              editingId={editingId}
              canDelete={false}
              role="redactor"
              onEdit={onEdit}
              onDelete={() => {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
