"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withTiming } from "@/lib/monitoring/timing";
import { requireCrmAccess } from "./auth";
import { addHistory } from "./history";
import { insertWithSequentialNumber } from "./numbering";
import { formatCurrencyMXN } from "./format";
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
    createdAt: row.created_at,
  };
}

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

export async function getQuotes(): Promise<CrmQuote[]> {
  return withTiming("crm.getQuotes", async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("crm_quotes").select("*").order("created_at", { ascending: false });
    return (data ?? []).map(mapQuote);
  });
}

export async function getQuoteDetail(quoteId: string): Promise<QuoteDetail | null> {
  const supabase = await createClient();

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("crm_quotes").select("*").eq("id", quoteId).single(),
    supabase.from("crm_quote_items").select("*").eq("quote_id", quoteId).order("position", { ascending: true }),
  ]);

  if (!quote) return null;

  return { quote: mapQuote(quote), items: (items ?? []).map(mapQuoteItem) };
}

export async function createQuoteAction(
  _prevState: CrmActionState,
  formData: FormData
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const clientId = String(formData.get("clientId") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientCompany = String(formData.get("clientCompany") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const taxRate = Number(formData.get("taxRate") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();
  const validUntil = String(formData.get("validUntil") ?? "").trim();

  if (!clientName) {
    return { error: "Escribe el nombre del cliente o prospecto" };
  }

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
    return { error: "Agrega al menos una línea válida (concepto, cantidad y precio)" };
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const supabase = await createClient();
  const result = await insertWithSequentialNumber(supabase, "crm_quotes", "COT", {
    client_id: clientId || null,
    client_name: clientName,
    client_company: clientCompany || null,
    client_email: clientEmail || null,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total,
    notes: notes || null,
    valid_until: validUntil || null,
    created_by: check.userId,
  });

  if ("error" in result) return { error: result.error };

  const { error: itemsError } = await supabase.from("crm_quote_items").insert(
    items.map((item, position) => ({
      quote_id: result.data.id,
      concept: item.concept,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      position,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  if (clientId) {
    await addHistory(
      supabase,
      clientId,
      "cotizacion",
      `Cotización ${result.number} creada por ${formatCurrencyMXN(total)}`,
      check.userId
    );
  }
  revalidatePath("/admin");
  return { success: true };
}

export async function updateQuoteStatusAction(
  quoteId: string,
  clientId: string | null,
  status: QuoteStatus
): Promise<CrmActionState> {
  const check = await requireCrmAccess();
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("crm_quotes").update({ status }).eq("id", quoteId);
  if (error) return { error: error.message };

  if (clientId) {
    await addHistory(supabase, clientId, "cotizacion", `Cotización actualizada a "${status}"`, check.userId);
  }
  revalidatePath("/admin");
  return { success: true };
}
