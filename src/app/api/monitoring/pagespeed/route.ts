import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessCrm, type ProfileRole } from "@/lib/auth/roles";
import { getPageSpeedSummary } from "@/lib/monitoring/pagespeed";

/**
 * Returns the cached PageSpeed Insights summary (Lighthouse scores + lab
 * metrics + CrUX field data, for mobile and desktop) consumed by
 * `PageSpeedSection` on the admin monitoring dashboard.
 *
 * CRM-staff only: the underlying PSI call is slow and rate-limited, so this
 * must not be an open proxy. The result itself is cached for 6 h in
 * `getPageSpeedSummary`, so an authorised caller hitting this repeatedly
 * still triggers at most one upstream analysis per form factor per window.
 *
 * Fails soft with a 200 + `{ error }` body: a PSI outage should degrade the
 * one dashboard card, not surface as a failed request in the client.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("team, role")
    .eq("id", user.id)
    .single();

  if (!profile || !canAccessCrm(profile as ProfileRole)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  try {
    const summary = await getPageSpeedSummary();
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Error al consultar PageSpeed",
    });
  }
}
