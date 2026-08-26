import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

  const [clients, payments, projects, invoices, quotes, tasks] = await Promise.all([
    getClients(),
    getAllPayments(),
    getProjects(),
    getInvoices(),
    getQuotes(),
    getAllTasks(),
  ]);

  return (
    <CrmDashboard
      email={user?.email ?? ""}
      clients={clients}
      payments={payments}
      projects={projects}
      invoices={invoices}
      quotes={quotes}
      tasks={tasks}
    />
  );
}
