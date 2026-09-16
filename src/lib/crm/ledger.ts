/**
 * Pure builder for a client's "Estado de cuenta" movement list: it folds a
 * client's cobros (money in) and the recurring services it has contracted into
 * one chronological stream, newest first, so the workspace shows "qué contrató
 * · cuánto · cuándo" and "qué pagó · cuándo" in one place. Egresos are a
 * company-level concern and deliberately excluded here. Kept dependency-free
 * (no `"use server"`, no Supabase) so it's unit-testable and safe in a client
 * component; the caller passes data it already has in props.
 */

import type { ClientPayment, ClientPlan, PaymentStatus } from "./clients";
import type { CrmInvoice } from "./invoices";

export type LedgerEntry = {
  /** `crm_payments.id` or `crm_plans.id` — unique within the merged list. */
  id: string;
  /** YYYY-MM-DD used for both sorting and display. */
  date: string;
  kind: "cobro" | "servicio";
  /** Always positive; a cobro is money in, a servicio is the contracted amount. */
  amount: number;
  /** "Cobro" / "Cobro · transferencia", or "Contrató: <plan>". */
  label: string;
  /** Payment status — only set for `kind === "cobro"`. */
  status?: PaymentStatus;
  /** Folio of the invoice generated from this charge, if any (cobro only). */
  invoiceNumber?: string | null;
  /** Cycle + next charge date, e.g. "mensual · próximo cobro 2026-09-30" (servicio only). */
  detail?: string | null;
};

/**
 * Merges `payments` and `plans` for one client into a single list ordered by
 * date descending (same day: the cobro sits above the contratación).
 * `invoices` is only used to surface the folio of an invoice generated from a
 * charge.
 */
export function buildClientLedger(
  payments: ClientPayment[],
  plans: ClientPlan[],
  invoices: CrmInvoice[] = []
): LedgerEntry[] {
  const invoiceByPayment = new Map<string, string>();
  for (const inv of invoices) {
    if (inv.paymentId) invoiceByPayment.set(inv.paymentId, inv.number);
  }

  const fromPayments: LedgerEntry[] = payments.map((p) => ({
    id: p.id,
    date: p.paidDate ?? p.dueDate,
    kind: "cobro",
    amount: p.amount,
    label: p.method ? `Cobro · ${p.method}` : "Cobro",
    status: p.status,
    invoiceNumber: invoiceByPayment.get(p.id) ?? null,
  }));

  const fromPlans: LedgerEntry[] = plans.map((pl) => ({
    id: pl.id,
    date: (pl.createdAt ?? pl.nextDueDate).slice(0, 10),
    kind: "servicio",
    amount: pl.amount,
    label: `Contrató: ${pl.name}`,
    detail: `${pl.billingCycle} · próximo cobro ${pl.nextDueDate}`,
  }));

  return [...fromPayments, ...fromPlans].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.kind !== b.kind) return a.kind === "cobro" ? -1 : 1;
    return 0;
  });
}
