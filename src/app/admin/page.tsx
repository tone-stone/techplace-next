import type { Metadata } from "next";
import { redirect } from "next/navigation";

/**
 * Server-rendered entry point for the dashboard at `/admin`. Resolves the
 * signed-in account's role, fetches only the datasets that role's modules
 * need (in parallel), and hands them to the client-side `CrmDashboard`
 * shell. The proxy already enforced that the user is signed in with a valid
 * role; the redirect here is defence in depth.
 */

import { createClient } from "@/lib/supabase/server";
import { getAssignableUsers, listUsers } from "@/lib/auth/users";
import { listArticles } from "@/lib/blog/articles";
import { getAllPayments, getClients } from "@/lib/crm/clients";
import { getAllContacts } from "@/lib/crm/contacts";
import { getClientHealthMap, getUpcomingCollections } from "@/lib/crm/collections";
import { getProjectNames, getProjects } from "@/lib/crm/projects";
import { getInvoices } from "@/lib/crm/invoices";
import { getQuotes } from "@/lib/crm/quotes";
import { getAllTasks } from "@/lib/crm/tasks";
import { getAssets } from "@/lib/it/assets";
import { getTickets } from "@/lib/it/tickets";
import {
  canManageAllUsers,
  canManageBlogUsers,
  canReadBilling,
  canSeeMonitoring,
  canUseBlogModule,
  canUseCrmCore,
  canUseSupport,
  canOpenDashboard,
  type ProfileRole,
  type Role,
} from "@/lib/auth/roles";
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
  title: "Panel | TechPlace",
};

const EMPTY_MONITORING = {
  recentErrors: [],
  errorStats: { daily: [], last24h: 0, last7d: 0 },
  webVitals: [],
  slowOperations: [],
  slowPages: [],
  failedLogins: { last24h: 0, last7d: 0, recent: [] },
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).is("deleted_at", null).single();
  const role = (profile as ProfileRole | null)?.role;
  if (!role || !canOpenDashboard(role)) redirect("/login");
  const r = role as Role;

  const crmCore = canUseCrmCore(r);
  const billing = canReadBilling(r);
  const support = canUseSupport(r);
  const blog = canUseBlogModule(r);
  const monitoring = canSeeMonitoring(r);

  const [
    clients,
    payments,
    projects,
    invoices,
    quotes,
    collections,
    clientHealth,
    assets,
    tickets,
    contactsAll,
    tasks,
    assignees,
    usersResult,
    blogUsersResult,
    articlesResult,
    mon,
  ] = await Promise.all([
    crmCore ? getClients() : Promise.resolve([]),
    crmCore ? getAllPayments() : Promise.resolve([]),
    crmCore ? getProjects() : Promise.resolve([]),
    billing ? getInvoices() : Promise.resolve([]),
    crmCore ? getQuotes() : Promise.resolve([]),
    billing ? getUpcomingCollections() : Promise.resolve([]),
    billing ? getClientHealthMap() : Promise.resolve({}),
    support ? getAssets() : Promise.resolve([]),
    support ? getTickets() : Promise.resolve([]),
    support ? getAllContacts() : Promise.resolve([]),
    getAllTasks(),
    getAssignableUsers(),
    canManageAllUsers(r) ? listUsers() : Promise.resolve({ users: [] }),
    canManageBlogUsers(r) ? listUsers({ blogOnly: true }) : Promise.resolve({ users: [] }),
    blog ? listArticles() : Promise.resolve({ articles: [] }),
    monitoring
      ? Promise.all([
          getRecentErrors(),
          getErrorStats(),
          getWebVitalsSummary(),
          getSlowOperations(),
          getSlowPagesByTtfb(),
          getFailedLogins(),
        ])
      : Promise.resolve(null),
  ]);

  const projectOptions = crmCore
    ? projects.map((p) => ({ id: p.id, name: p.name }))
    : await getProjectNames();

  const monitoringProps = mon
    ? {
        recentErrors: mon[0],
        errorStats: mon[1],
        webVitals: mon[2],
        slowOperations: mon[3],
        slowPages: mon[4],
        failedLogins: mon[5],
      }
    : EMPTY_MONITORING;

  return (
    <CrmDashboard
      email={user.email ?? ""}
      userName={(user.user_metadata?.full_name as string | undefined) ?? ""}
      userId={user.id}
      role={r}
      users={"users" in usersResult ? usersResult.users : []}
      blogUsers={"users" in blogUsersResult ? blogUsersResult.users : []}
      assignees={assignees}
      blogArticles={"articles" in articlesResult ? articlesResult.articles : []}
      projectOptions={projectOptions}
      clients={clients}
      payments={payments}
      projects={projects}
      invoices={invoices}
      quotes={quotes}
      collections={collections}
      clientHealth={clientHealth}
      assets={assets}
      tickets={tickets}
      contacts={contactsAll}
      tasks={tasks}
      {...monitoringProps}
    />
  );
}
