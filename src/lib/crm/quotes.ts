"use server";

/**
 * CRM quotes: data fetching plus server actions for creating quotes (with
 * their line items and an auto-generated sequential folio via
 * `insertWithSequentialNumber`) and updating status. Quotes can target
 * either an existing CRM client or a standalone prospect entered by hand
 * (`clientId` is nullable). Every mutation requires `requireCrmCore()`.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmCore } from "./auth";
import { softDelete } from "./soft-delete";
import { addHistory } from "./history";
import { insertWithSequentialNumber } from "./numbering";
import { formatCurrencyMXN } from "./format";
import { sendEmail } from "@/lib/email/client";
import { sendWhatsApp } from "@/lib/whatsapp/client";
import { quoteAcceptedEmail, quoteSentEmail } from "@/lib/email/templates";
import { quoteAcceptedWhatsApp, quoteSentWhatsApp } from "@/lib/notify/messages";
import { readNotifySettings } from "@/lib/notify/config";
import type { CrmActionState } from "./clients";

export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada";

export type CrmQuote = {
  id: string;
  number: string;
  clientId: string | null;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string | null;
  status: QuoteStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  validUntil: string | null;
  /** Editable "fecha de creación" (issue date); falls back to `createdAt` when migration 0034 is pending. */
  issuedDate: string;
  /** Per-quote override of the executive legends; `null` → use `DEFAULT_QUOTE_TERMS`. */
  terms: string | null;
  /** Recurring plan created from this quote, if any (see `createPlanFromQuoteAction`). */
  planId: string | null;
  createdAt: string;
};

export type QuoteItem = {
  id: string;
  quoteId: string;
  concept: string;
  quantity: number;
  unitPrice: number;
  position: number;
};

export type QuoteDetail = { quote: CrmQuote; items: QuoteItem[] };

type RawLineItem = { concept: string; quantity: number; unitPrice: number };

/** Converts a raw `crm_quotes` row (snake_case) into a `CrmQuote`. */
function mapQuote(row: {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  client_company: string | null;
  client_email: string | null;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  valid_until: string | null;
  issued_date?: string | null;
  terms?: string | null;
  plan_id: string | null;
  created_at: string;
}): CrmQuote {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmail: row.client_email,
    status: row.status as QuoteStatus,
    subtotal: Number(row.subtotal),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    total: Number(row.total),
    notes: row.notes,
    validUntil: row.valid_until,
    issuedDate: row.issued_date ?? (row.created_at ? row.created_at.slice(0, 10) : ""),
    terms: row.terms ?? null,
    planId: row.plan_id ?? null,
    createdAt: row.created_at,
  };
}

/** Converts a raw `crm_quote_items` row (snake_case) into a `QuoteItem`. */
function mapQuoteItem(row: {
  id: string;
  quote_id: string;
  concept: string;
  quantity: number;
  unit_price: number;
  position: number;
}): QuoteItem {
  return {
    id: row.id,
    quoteId: row.quote_id,
    concept: row.concept,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    position: row.position,
  };
}

/** Fetches every quote, most recently created first. */
export async function getQuotes(): Promise<CrmQuote[]> {
  return withTiming("crm.getQuotes", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_quotes").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    return (data ?? []).map(mapQuote);
  });
}

/** Fetches a quote and its line items, used by `QuoteDetailModal` and the PDF export. */
export async function getQuoteDetail(quoteId: string): Promise<QuoteDetail | null> {
  const supabase = await createClient();

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("crm_quotes").select("*").eq("id", quoteId).single(),
    supabase.from("crm_quote_items").select("*").eq("quote_id", quoteId).order("position", { ascending: true }),
  ]);

  if (!quote) return null;

  return { quote: mapQuote(quote), items: (items ?? []).map(mapQuoteItem) };
}

/** True when a Postgres error is "column ... does not exist" for migration 0034's columns. */
function isMissingQuoteExtraColumn(msg: string | undefined) {
  return !!msg && /column .*(issued_date|terms).* does not exist/i.test(msg);
}

type ParsedQuoteForm = {
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  taxRate: number;
  notes: string;
  validUntil: string;
  issuedDate: string;
  terms: string;
  items: RawLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
};

/**
 * Shared parse + validation for the create and update quote forms. Reads the
 * client fields, the JSON `items` array built by `QuoteFormModal`, the tax
 * rate, and the new `issuedDate` / `terms` fields, then recomputes the money
 * server-side (never trusting the client's totals).
 */
function parseQuoteForm(formData: FormData): { ok: true; data: ParsedQuoteForm } | { ok: false; error: string } {
  const clientName = String(formData.get("clientName") ?? "").trim();
  if (!clientName) return { ok: false, error: "Escribe el nombre del cliente o prospecto" };

  let items: RawLineItem[];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    if (!Array.isArray(raw) || raw.length === 0) throw new Error("empty");
    items = raw.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const concept = String(i.concept ?? "").trim();
      const quantity = Number(i.quantity);
      const unitPrice = Number(i.unitPrice);
      if (!concept || !(quantity > 0) || !(unitPrice >= 0)) throw new Error("invalid item");
      return { concept, quantity, unitPrice };
    });
  } catch {
    return { ok: false, error: "Agrega al menos una línea válida (concepto, cantidad y precio)" };
  }

  const taxRate = Number(formData.get("taxRate") ?? 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);

  return {
    ok: true,
    data: {
      clientId: String(formData.get("clientId") ?? "").trim(),
      clientName,
      clientCompany: String(formData.get("clientCompany") ?? "").trim(),
      clientEmail: String(formData.get("clientEmail") ?? "").trim(),
      taxRate,
      notes: String(formData.get("notes") ?? "").trim(),
      validUntil: String(formData.get("validUntil") ?? "").trim(),
      issuedDate: String(formData.get("issuedDate") ?? "").trim(),
      terms: String(formData.get("terms") ?? "").trim(),
      items,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    },
  };
}

/**
 * `useActionState` action backing the "Nueva cotización" form. Parses the
 * `items` field (a JSON-encoded array built client-side by `QuoteFormModal`)
 * and validates each line before computing subtotal/tax/total server-side.
 */
export async function createQuoteAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const parsed = parseQuoteForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const f = parsed.data;

  const supabase = await createClient();
  const base = {
    client_id: f.clientId || null,
    client_name: f.clientName,
    client_company: f.clientCompany || null,
    client_email: f.clientEmail || null,
    subtotal: f.subtotal,
    tax_rate: f.taxRate,
    tax_amount: f.taxAmount,
    total: f.total,
    notes: f.notes || null,
    valid_until: f.validUntil || null,
    created_by: check.userId,
  };
  const extras = { issued_date: f.issuedDate || undefined, terms: f.terms || null };

  let result = await insertWithSequentialNumber(supabase, "crm_quotes", "COT", { ...base, ...extras });
  if ("error" in result && isMissingQuoteExtraColumn(result.error)) {
    result = await insertWithSequentialNumber(supabase, "crm_quotes", "COT", base); // migration 0034 pending
  }
  if ("error" in result) return { error: result.error };

  const { error: itemsError } = await supabase.from("crm_quote_items").insert(
    f.items.map((item, position) => ({
      quote_id: result.data.id,
      concept: item.concept,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      position,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  if (f.clientId) {
    await addHistory(
      supabase,
      f.clientId,
      "cotizacion",
      `Cotización ${result.number} creada por ${formatCurrencyMXN(f.total)}`,
      check.userId
    );
  }
  revalidatePath("/admin");
  return { success: true };
}

/**
 * `useActionState` action backing the "Editar cotización" form — full CRUD so
 * capture errors (client, líneas, fechas, IVA, notas, condiciones) can be
 * fixed. Replaces the quote's line items wholesale. The folio and creator are
 * never touched.
 */
export async function updateQuoteAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const quoteId = String(formData.get("quoteId") ?? "").trim();
  if (!quoteId) return { error: "Cotización no encontrada" };

  const parsed = parseQuoteForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const f = parsed.data;

  const supabase = await createClient();
  const base = {
    client_id: f.clientId || null,
    client_name: f.clientName,
    client_company: f.clientCompany || null,
    client_email: f.clientEmail || null,
    subtotal: f.subtotal,
    tax_rate: f.taxRate,
    tax_amount: f.taxAmount,
    total: f.total,
    notes: f.notes || null,
    valid_until: f.validUntil || null,
  };
  const extras = { issued_date: f.issuedDate || undefined, terms: f.terms || null };

  let { data: updated, error } = await supabase
    .from("crm_quotes")
    .update({ ...base, ...extras })
    .eq("id", quoteId)
    .is("deleted_at", null)
    .select("number")
    .single();
  if (error && isMissingQuoteExtraColumn(error.message)) {
    ({ data: updated, error } = await supabase
      .from("crm_quotes")
      .update(base)
      .eq("id", quoteId)
      .is("deleted_at", null)
      .select("number")
      .single()); // migration 0034 pending
  }
  if (error) return { error: error.message };

  await supabase.from("crm_quote_items").delete().eq("quote_id", quoteId);
  const { error: itemsError } = await supabase.from("crm_quote_items").insert(
    f.items.map((item, position) => ({
      quote_id: quoteId,
      concept: item.concept,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      position,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  if (f.clientId) {
    await addHistory(
      supabase,
      f.clientId,
      "cotizacion",
      `Cotización ${updated?.number ?? ""} actualizada · ${formatCurrencyMXN(f.total)}`.trim(),
      check.userId
    );
  }
  revalidatePath("/admin");
  return { success: true };
}

/** Updates a quote's status; logs the change to the client's history only when `clientId` is set. */
export async function updateQuoteStatusAction(
  quoteId: string,
  clientId: string | null,
  status: QuoteStatus
): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_quotes").update({ status }).eq("id", quoteId);
  if (error) return { error: error.message };

  if (clientId) {
    await addHistory(supabase, clientId, "cotizacion", `Cotización actualizada a "${status}"`, check.userId);
  }

  // Real-time notifications for the two lifecycle steps that matter. Never let a
  // delivery hiccup fail the status change the user just made.
  if (status === "enviada" || status === "aceptada") {
    try {
      await notifyQuoteEvent(supabase, quoteId, clientId, status);
    } catch (err) {
      console.warn("[quotes] notificación omitida:", err instanceof Error ? err.message : err);
    }
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fires the "enviada" (to the client) or "aceptada" (to the team) notice over
 * email + WhatsApp. Best-effort: individual channel failures are swallowed.
 */
async function notifyQuoteEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteId: string,
  clientId: string | null,
  status: "enviada" | "aceptada"
): Promise<void> {
  const { data: q } = await supabase
    .from("crm_quotes")
    .select("number, client_name, client_email, total, valid_until")
    .eq("id", quoteId)
    .maybeSingle();
  if (!q) return;

  const notify = await readNotifySettings(async (cols) => {
    const { data } = await supabase.from("app_settings").select(cols).eq("id", true).maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  });
  const total = Number(q.total) || 0;

  if (status === "enviada") {
    let contactName: string | null = null;
    let phone: string | null = null;
    if (clientId) {
      const { data: contact } = await supabase
        .from("crm_contacts")
        .select("name, phone")
        .eq("client_id", clientId)
        .eq("is_primary", true)
        .is("deleted_at", null)
        .maybeSingle();
      contactName = contact?.name ?? null;
      phone = contact?.phone ?? null;
    }
    if (q.client_email) {
      const { subject, html } = quoteSentEmail({
        orgName: notify.orgName,
        number: q.number,
        contactName,
        total,
        validUntil: q.valid_until,
      });
      await sendEmail({ to: q.client_email, subject, html, from: notify.fromEmail });
    }
    if (notify.whatsappReady && phone) {
      await sendWhatsApp({
        to: phone,
        body: quoteSentWhatsApp({
          orgName: notify.orgName,
          number: q.number,
          contactName,
          total,
          validUntil: q.valid_until,
        }),
      });
    }
    return;
  }

  // status === "aceptada" → internal alert
  const { data: staff } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["dios", "admin"])
    .is("deleted_at", null);
  const recipients = [
    ...new Set([
      ...(staff ?? []).map((s) => s.email).filter((e): e is string => !!e),
      ...notify.internalEmail,
    ]),
  ];
  if (recipients.length > 0) {
    const { subject, html } = quoteAcceptedEmail({
      orgName: notify.orgName,
      number: q.number,
      clientName: q.client_name,
      total,
    });
    await sendEmail({ to: recipients, subject, html, from: notify.fromEmail });
  }
  if (notify.whatsappReady && notify.internalWhatsApp.length > 0) {
    await sendWhatsApp({
      to: notify.internalWhatsApp,
      body: quoteAcceptedWhatsApp({
        orgName: notify.orgName,
        number: q.number,
        clientName: q.client_name,
        total,
      }),
    });
  }
}

/** Soft-deletes a quote (recoverable; logged to `deletion_log`). */
export async function deleteQuoteAction(quoteId: string, clientId?: string | null): Promise<CrmActionState> {
  const check = await requireCrmCore();
  if (!check.ok) return { error: check.error };

  const result = await softDelete({
    table: "crm_quotes",
    id: quoteId,
    actorId: check.userId,
    actorEmail: check.email,
  });
  if (!result.ok) return { error: result.error };

  if (clientId) {
    const supabase = await createClient();
    await addHistory(supabase, clientId, "cotizacion", "Cotización eliminada", check.userId);
  }
  revalidatePath("/admin");
  return { success: true };
}
