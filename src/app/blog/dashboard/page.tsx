import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listArticles } from "@/lib/blog/articles";
import { showsBlogAdminView, type ProfileRole } from "@/lib/auth/roles";
import DashboardClient from "@/components/blog/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Portal de Redacción",
};

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
  const initialRole = profile && showsBlogAdminView(profile as ProfileRole) ? "admin" : "redactor";

  const articlesResult = await listArticles();
  const initialArticles = "articles" in articlesResult ? articlesResult.articles : [];

  return (
    <DashboardClient
      email={user.email ?? ""}
      initialRole={initialRole}
      initialArticles={initialArticles}
    />
  );
}
