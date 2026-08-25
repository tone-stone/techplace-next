import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/auth/users";
import { listArticles } from "@/lib/blog/articles";
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const initialRole = profile?.role === "admin" ? "admin" : "redactor";

  const [usersResult, articlesResult] = await Promise.all([listUsers(), listArticles()]);
  const initialUsers = "users" in usersResult ? usersResult.users : [];
  const initialArticles = "articles" in articlesResult ? articlesResult.articles : [];

  return (
    <DashboardClient
      email={user.email ?? ""}
      userId={user.id}
      initialRole={initialRole}
      initialUsers={initialUsers}
      initialArticles={initialArticles}
    />
  );
}
