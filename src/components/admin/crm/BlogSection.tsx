"use client";

/**
 * "Blog" module inside the CRM dashboard. Self-contained content — Artículos,
 * Usuarios del blog, Actividad — dropped into the CRM `<main>` like any other
 * section. `dios`/`admin`/`blog` see all three sub-sections; `redactor` sees
 * only Artículos. Reuses `ArticleForm`, `ArticleList`, `UserManagement`,
 * `ActivityLog`.
 */

import { useState } from "react";
import { FileText, History, Newspaper, Tags, Users } from "lucide-react";
import { deleteArticleAction, listArticles, type ManagedArticle } from "@/lib/blog/articles";
import { assignableRoles, canManageBlogUsers, type Role } from "@/lib/auth/roles";
import type { ManagedUser } from "@/lib/auth/users";
import { CATEGORIES } from "@/lib/blog-posts";
import ArticleForm from "@/components/blog/dashboard/ArticleForm";
import ArticleList from "@/components/blog/dashboard/ArticleList";
import ActivityLog from "@/components/blog/dashboard/ActivityLog";
import UserManagement from "@/components/blog/dashboard/UserManagement";
import type { ActivityAction, ActivityEntry } from "@/components/blog/dashboard/types";

type Sub = "articles" | "users" | "activity";

const SUB_NAV: { id: Sub; label: string; icon: typeof Newspaper }[] = [
  { id: "articles", label: "Artículos", icon: Newspaper },
  { id: "users", label: "Usuarios del blog", icon: Users },
  { id: "activity", label: "Actividad", icon: History },
];

export default function BlogSection({
  role,
  articles: initialArticles,
  users: initialUsers,
  authorEmail,
  currentUserId,
}: {
  role: Role;
  articles: ManagedArticle[];
  users: ManagedUser[];
  authorEmail: string;
  currentUserId: string;
}) {
  // redactor only writes articles; blog/admin/dios also see the blog-team
  // account panel and the activity log.
  const showsExtras = canManageBlogUsers(role);
  const nav = showsExtras ? SUB_NAV : SUB_NAV.filter((item) => item.id === "articles");
  const [sub, setSub] = useState<Sub>("articles");
  const [articles, setArticles] = useState<ManagedArticle[]>(initialArticles);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingArticle = editingId ? (articles.find((a) => a.id === editingId) ?? null) : null;

  const logActivity = (action: ActivityAction, title: string) => {
    setActivity((prev) =>
      [
        { id: crypto.randomUUID(), actor: authorEmail, action, title, timestamp: new Date().toISOString() },
        ...prev,
      ].slice(0, 30)
    );
  };

  const refreshArticles = async () => {
    const result = await listArticles();
    if ("articles" in result) setArticles(result.articles);
  };

  const handleArticleSaved = (title: string, mode: "creó" | "editó") => {
    logActivity(mode, title);
    setEditingId(null);
    refreshArticles();
  };

  const handleDelete = async (id: string) => {
    const target = articles.find((a) => a.id === id);
    const result = await deleteArticleAction(id);
    if (result && "error" in result) return;
    if (target) logActivity("eliminó", target.title);
    if (editingId === id) setEditingId(null);
    refreshArticles();
  };

  const stats = [
    { label: "Artículos", value: articles.length, icon: Newspaper },
    { label: "Categorías", value: CATEGORIES.length, icon: Tags },
    { label: "Borradores", value: articles.filter((a) => a.status === "draft").length, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSub(item.id)}
            aria-pressed={sub === item.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              sub === item.id
                ? "border-purple-400/40 bg-purple-500/15 text-white"
                : "border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {sub === "articles" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="tp-dark-card-admin flex items-center gap-4 rounded-2xl p-5"
              >
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
                defaultAuthor={authorEmail}
                role="admin"
                onSaved={handleArticleSaved}
                onCancelEdit={() => setEditingId(null)}
              />
            </div>
            <div className="lg:col-span-3">
              <ArticleList
                articles={articles}
                editingId={editingId}
                canDelete
                role="admin"
                onEdit={setEditingId}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </>
      )}

      {sub === "users" && showsExtras && (
        <UserManagement
          currentUserId={currentUserId}
          initialUsers={initialUsers}
          assignableRoles={assignableRoles(role).filter((r) => r === "blog" || r === "redactor")}
          scope="blog"
          accent="purple"
        />
      )}

      {sub === "activity" && showsExtras && <ActivityLog entries={activity} />}
    </div>
  );
}
