import { NextResponse, type NextRequest } from "next/server";
import { runBillingCycle } from "@/lib/crm/billing-run";
import { withTiming } from "@/lib/monitoring/timing";

/**
 * Daily cobranza job, triggered by Vercel Cron (see `vercel.json`, 15:00 UTC ≈
 * 09:00 CST). Vercel sends `Authorization: Bearer $CRON_SECRET`; anything else
 * gets a 401. Generates due charges, marks overdue payments, and sends the
 * reminder + digest emails (see `runBillingCycle`).
 *
 * Always returns 200 so a transient failure doesn't make Vercel retry-storm or
 * page; partial failures come back in the `errors` array for the logs.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await withTiming("cron.cobranza", () => runBillingCycle());
    if (result.errors.length > 0) {
      console.error("[cron.cobranza] terminó con errores:", result.errors);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron.cobranza] falló:", message);
    return NextResponse.json({ ok: false, error: message });
  }
}
