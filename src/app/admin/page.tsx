import type { Metadata } from "next";

/**
 * Server-rendered entry point for the CRM at `/admin`. Resolves the current
 * user's admin status, fetches every dataset the dashboard needs (clients,
 * payments, projects, invoices, quotes, tasks, users, and monitoring stats)
 * in parallel, and hands it all off to the client-side `CrmDashboard` shell.
 */

import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/auth/users";
import { getAllPayments, getClients } from "@/lib/crm/clients";
import { getProjects } from "@/lib/crm/projects";
import { getInvoices } from "@/lib/crm/invoices";
import { getQuotes } from "@/lib/crm/quotes";
import { getAllTasks } from "@/lib/crm/tasks";
import { isCrmAdmin, type ProfileRole } from "@/lib/auth/roles";
import {
  getErrorStats,
  getFailedLogins,
  getRecentErrors,
  getSlowOperations,
  getSlowPagesByTtfb,
  getWebVitalsSummary,
} from "@/lib/monitoring/queries";
import CrmDashboard from "@/components/admin/CrmDashboard";

export const metadata: Metadata = {
  title: "CRM | TechPlace",
};

/** CRM page (RSC): loads all dashboard data server-side and renders `CrmDashboard`. */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserIsAdmin = user
    ? await supabase
        .from("profiles")
        .select("team, role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => Boolean(data) && isCrmAdmin(data as ProfileRole))
    : false;

  const [
    clients,
    payments,
    projects,
    invoices,
    quotes,
    tasks,
    usersResult,
    recentErrors,
    errorStats,
    webVitals,
    slowOperations,
    slowPages,
    failedLogins,
  ] = await Promise.all([
    getClients(),
    getAllPayments(),
    getProjects(),
    getInvoices(),
    getQuotes(),
    getAllTasks(),
    listUsers(),
    getRecentErrors(),
    getErrorStats(),
    getWebVitalsSummary(),
    getSlowOperations(),
    getSlowPagesByTtfb(),
    getFailedLogins(),
  ]);

  const users = "users" in usersResult ? usersResult.users : [];

  return (
    <CrmDashboard
      email={user?.email ?? ""}
      userName={(user?.user_metadata?.full_name as string | undefined) ?? ""}
      userId={user?.id ?? ""}
      users={users}
      currentUserIsAdmin={currentUserIsAdmin}
      clients={clients}
      payments={payments}
      projects={projects}
      invoices={invoices}
      quotes={quotes}
      tasks={tasks}
      recentErrors={recentErrors}
      errorStats={errorStats}
      webVitals={webVitals}
      slowOperations={slowOperations}
      slowPages={slowPages}
      failedLogins={failedLogins}
    />
  );
}
