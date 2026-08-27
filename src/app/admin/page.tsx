import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/auth/users";
import { getAllPayments, getClients } from "@/lib/crm/clients";
import { getProjects } from "@/lib/crm/projects";
import { getInvoices } from "@/lib/crm/invoices";
import { getQuotes } from "@/lib/crm/quotes";
import { getAllTasks } from "@/lib/crm/tasks";
import CrmDashboard from "@/components/admin/CrmDashboard";

export const metadata: Metadata = {
  title: "CRM | TechPlace",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [clients, payments, projects, invoices, quotes, tasks, usersResult] = await Promise.all([
    getClients(),
    getAllPayments(),
    getProjects(),
    getInvoices(),
    getQuotes(),
    getAllTasks(),
    listUsers(),
  ]);

  const users = "users" in usersResult ? usersResult.users : [];

  return (
    <CrmDashboard
      email={user?.email ?? ""}
      userId={user?.id ?? ""}
      users={users}
      clients={clients}
      payments={payments}
      projects={projects}
      invoices={invoices}
      quotes={quotes}
      tasks={tasks}
    />
  );
}
