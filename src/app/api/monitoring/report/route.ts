import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canSeeMonitoring, type ProfileRole } from "@/lib/auth/roles";
import { getMonitoringReport } from "@/lib/monitoring/report";

/**
 * Consolidated monitoring report for `?since` / `?until` (ISO). CRM-staff
 * only, same gate as the other monitoring routes. Consumed by
 * `ReportSection` on the admin dashboard, which re-fetches on range change.
 *
 * Fails soft with `200 + { error }` so a flaky read degrades the one card.
 */

const MAX_SPAN_MS = 400 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !canSeeMonitoring(profile as ProfileRole)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const url = new URL(request.url);
  const untilParam = url.searchParams.get("until");
  const sinceParam = url.searchParams.get("since");

  const until = untilParam && !Number.isNaN(Date.parse(untilParam)) ? untilParam : new Date().toISOString();
  const since =
    sinceParam && !Number.isNaN(Date.parse(sinceParam))
      ? sinceParam
      : new Date(Date.parse(until) - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (Date.parse(since) >= Date.parse(until)) {
    return NextResponse.json({ error: "Rango inválido" }, { status: 400 });
  }
  if (Date.parse(until) - Date.parse(since) > MAX_SPAN_MS) {
    return NextResponse.json({ error: "Rango demasiado amplio (máx. 400 días)" }, { status: 400 });
  }

  try {
    const report = await getMonitoringReport({ since, until });
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Error al generar el reporte",
    });
  }
}
