import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllPayments, getClients } from "@/lib/crm/clients";
import CrmDashboard from "@/components/admin/CrmDashboard";

export const metadata: Metadata = {
  title: "CRM | TechPlace",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [clients, payments] = await Promise.all([getClients(), getAllPayments()]);

  return <CrmDashboard email={user?.email ?? ""} clients={clients} payments={payments} />;
}
