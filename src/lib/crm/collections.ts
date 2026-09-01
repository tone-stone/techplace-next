import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { daysUntil } from "./plan-status";

/**
 * Read models for the "Cobranza" dashboard section and the client-health line
 * in the client list. Plain module (not `"use server"`): only called from the
 * `/admin` server component, and reads run as the signed-in user so RLS still
 * applies. Mutations reuse `markPaymentPaidAction` in `clients.ts`.
 */

export type CollectionItem = {
  paymentId: string;
  clientId: string;
  company: string;
  contactName: string | null;
  planName: string | null;
  amount: number;
  dueDate: string;
  daysLeft: number;
  status: "pendiente" | "vencido";
};

export type ClientHealth = {
  hasActivePlan: boolean;
  nextDueDate: string | null;
  overdueAmount: number;
};

/**
 * An active recurring plan and when its next charge falls — the "what's
 * coming" view, derived straight from `crm_plans` so a client with a plan
 * shows up in Cobranza before the daily cron generates the payment row.
 */
export type ScheduledCharge = {
  planId: string;
  clientId: string;
  company: string;
  contactName: string | null;
  planName: string;
  amount: number;
  billingCycle: string;
  nextDueDate: string;
  daysLeft: number;
};

/** Supabase embeds a to-one FK as an object, but its types often say array. Normalize. */
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

type RawCollectionRow = {
  id: string;
  client_id: string;
  amount: number | string;
  due_date: string;
  status: "pendiente" | "vencido";
  crm_plans: { name: string } | { name: string }[] | null;
  crm_clients:
    | { company: string; crm_contacts: { name: string; is_primary: boolean; deleted_at: string | null }[] }
    | null;
};

/** Every outstanding payment (pendiente / vencido), enriched for display, due date first. */
export async function getUpcomingCollections(): Promise<CollectionItem[]> {
  return withTiming("crm.getUpcomingCollections", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_payments")
      .select(
        `id, client_id, amount, due_date, status,
         crm_plans(name),
         crm_clients(company, crm_contacts(name, is_primary, deleted_at))`
      )
      .in("status", ["pendiente", "vencido"])
      .order("due_date", { ascending: true });

    const now = new Date();
    return ((data ?? []) as unknown as RawCollectionRow[]).map((r) => {
      const client = one(r.crm_clients);
      const plan = one(r.crm_plans);
      const primary = client?.crm_contacts?.find((c) => c.is_primary && !c.deleted_at) ?? null;
      return {
        paymentId: r.id,
        clientId: r.client_id,
        company: client?.company ?? "—",
        contactName: primary?.name ?? null,
        planName: plan?.name ?? null,
        amount: Number(r.amount),
        dueDate: r.due_date,
        daysLeft: daysUntil(r.due_date, now),
        status: r.status,
      };
    });
  });
}

type RawScheduledRow = {
  id: string;
  client_id: string;
  name: string;
  amount: number | string;
  billing_cycle: string;
  next_due_date: string;
  crm_clients:
    | { company: string; crm_contacts: { name: string; is_primary: boolean; deleted_at: string | null }[] }
    | { company: string; crm_contacts: { name: string; is_primary: boolean; deleted_at: string | null }[] }[]
    | null;
};

/** Every active plan with its next charge date, soonest first. */
export async function getScheduledCharges(): Promise<ScheduledCharge[]> {
  return withTiming("crm.getScheduledCharges", async () => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crm_plans")
      .select(
        `id, client_id, name, amount, billing_cycle, next_due_date,
         crm_clients(company, crm_contacts(name, is_primary, deleted_at))`
      )
      .eq("status", "activo")
      .order("next_due_date", { ascending: true });

    const now = new Date();
    return ((data ?? []) as unknown as RawScheduledRow[]).map((r) => {
      const client = one(r.crm_clients);
      const primary = client?.crm_contacts?.find((c) => c.is_primary && !c.deleted_at) ?? null;
      return {
        planId: r.id,
        clientId: r.client_id,
        company: client?.company ?? "—",
        contactName: primary?.name ?? null,
        planName: r.name,
        amount: Number(r.amount),
        billingCycle: r.billing_cycle,
        nextDueDate: r.next_due_date,
        daysLeft: daysUntil(r.next_due_date, now),
      };
    });
  });
}

/** Per-client billing health, keyed by client id, for the client list. */
export async function getClientHealthMap(): Promise<Record<string, ClientHealth>> {
  return withTiming("crm.getClientHealthMap", async () => {
    const supabase = await createClient();
    const [{ data: plans }, { data: payments }] = await Promise.all([
      supabase.from("crm_plans").select("client_id, next_due_date").eq("status", "activo"),
      supabase.from("crm_payments").select("client_id, amount").eq("status", "vencido"),
    ]);

    const map: Record<string, ClientHealth> = {};
    const get = (id: string) =>
      (map[id] ??= { hasActivePlan: false, nextDueDate: null, overdueAmount: 0 });

    for (const p of plans ?? []) {
      const h = get(p.client_id);
      h.hasActivePlan = true;
      if (p.next_due_date && (!h.nextDueDate || p.next_due_date < h.nextDueDate)) {
        h.nextDueDate = p.next_due_date;
      }
    }
    for (const p of payments ?? []) {
      get(p.client_id).overdueAmount += Number(p.amount);
    }
    return map;
  });
}
