import { NextResponse, type NextRequest } from "next/server";
import { runAgendaCycle } from "@/lib/crm/agenda-run";
import { withTiming } from "@/lib/monitoring/timing";

/**
 * Daily agenda job, triggered by Vercel Cron (see `vercel.json`, 15:10 UTC ≈
 * 09:10 CST — a few minutes after the cobranza cron). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; anything else gets a 401. Sends
 * dios/admin one internal digest of tasks / projects / support SLAs coming
 * due (see `runAgendaCycle`).
 *
 * Always returns 200 so a transient failure doesn't make Vercel retry-storm;
 * partial failures come back in the `errors` array for the logs.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await withTiming("cron.agenda", () => runAgendaCycle());
    if (result.errors.length > 0) {
      console.error("[cron.agenda] terminó con errores:", result.errors);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[cron.agenda] falló:", message);
    return NextResponse.json({ ok: false, error: message });
  }
}
