"use client";

import { useEffect, useState } from "react";
import { deleteArticleAction, listArticles, type ManagedArticle } from "@/lib/blog/articles";
import AdminDashboard from "./AdminDashboard";
import RedactorDashboard from "./RedactorDashboard";
import type { ActivityAction, ActivityEntry, DashboardRole } from "./types";

export default function DashboardClient({
  email,
  initialRole,
  initialArticles,
}: {
  email: string;
  initialRole: DashboardRole;
  initialArticles: ManagedArticle[];
}) {
  useEffect(() => {
    // pagehide fires when this tab/window actually closes or navigates away
    // to a different site — not on in-app client-side navigation, and not on
    // switching to another tab/app — so the session ends with the tab it was
    // opened in instead of outliving it.
    const endSession = () => {
      navigator.sendBeacon("/api/auth/close-session");
    };
    window.addEventListener("pagehide", endSession);
    return () => window.removeEventListener("pagehide", endSession);
  }, []);

  const [role, setRole] = useState<DashboardRole>(initialRole);
  const isRealAdmin = initialRole === "admin";
  const handleRoleChange = (next: DashboardRole) => {
    if (isRealAdmin) setRole(next);
  };
  const [articles, setArticles] = useState<ManagedArticle[]>(initialArticles);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingArticle = editingId ? (articles.find((a) => a.id === editingId) ?? null) : null;

  const logActivity = (action: ActivityAction, title: string) => {
    setActivity((prev) =>
      [{ id: crypto.randomUUID(), actor: email, action, title, timestamp: new Date().toISOString() }, ...prev].slice(
        0,
        30
      )
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

  if (role === "admin") {
    return (
      <AdminDashboard
        email={email}
        role={role}
        canPreview={isRealAdmin}
        onRoleChange={handleRoleChange}
        articles={articles}
        activity={activity}
        editingId={editingId}
        editingArticle={editingArticle}
        onSaved={handleArticleSaved}
        onCancelEdit={() => setEditingId(null)}
        onEdit={setEditingId}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <RedactorDashboard
      email={email}
      role={role}
      canPreview={isRealAdmin}
      onRoleChange={handleRoleChange}
      articles={articles}
      editingId={editingId}
      editingArticle={editingArticle}
      onSaved={handleArticleSaved}
      onCancelEdit={() => setEditingId(null)}
      onEdit={setEditingId}
    />
  );
}
