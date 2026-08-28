/**
 * Server entry point for the blog dashboard at `/blog/dashboard`. Redirects
 * unauthenticated visitors to the blog login, then loads the signed-in
 * user's profile to decide whether they see the admin or redactor view and
 * fetches the initial articles (and, for admins, the blog team's user list)
 * before handing off to the client-side `DashboardClient`.
 */
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listArticles } from "@/lib/blog/articles";
import { listUsers } from "@/lib/auth/users";
import { showsBlogAdminView, type ProfileRole } from "@/lib/auth/roles";
import DashboardClient from "@/components/blog/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Portal de Redacción",
};

/**
 * Resolves the current user's role and preloads dashboard data server-side,
 * then renders `DashboardClient` with that initial state.
 */
export default async function BlogDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/blog/login");
  }

  const { data: profile } = await supabase.from("profiles").select("team, role").eq("id", user.id).single();
  // showsBlogAdminView covers both the blog team's own admin and the CRM
  // general admin (who has full access to the blog too).
  const isAdminView = profile && showsBlogAdminView(profile as ProfileRole);
  const initialRole = isAdminView ? "admin" : "redactor";

  // The blog dashboard's own Usuarios panel is blog-only, even for the CRM
  // general admin browsing it from here — CRM account management stays in
  // the CRM's own Usuarios tab.
  const [articlesResult, usersResult] = await Promise.all([
    listArticles(),
    isAdminView ? listUsers({ blogOnly: true }) : Promise.resolve({ users: [] }),
  ]);
  const initialArticles = "articles" in articlesResult ? articlesResult.articles : [];
  const initialUsers = "users" in usersResult ? usersResult.users : [];

  return (
    <DashboardClient
      email={user.email ?? ""}
      userId={user.id}
      initialRole={initialRole}
      initialArticles={initialArticles}
      initialUsers={initialUsers}
    />
  );
}
