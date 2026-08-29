import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessCrm, type ProfileRole } from "@/lib/auth/roles";
import {
  getContactFunnel,
  getCtaClicks,
  getScrollDepth,
  getSectionEngagement,
} from "@/lib/monitoring/queries";

/**
 * Aggregated visitor-engagement metrics for `EngagementSection` on the admin
 * monitoring dashboard: per-section dwell time, scroll-depth funnel, top CTA
 * clicks, and the contact-form funnel — all over the last 7 days.
 *
 * CRM-staff only. Fetched client-side when the Monitoreo tab opens (rather
 * than server-rendered with `/admin`) so these four table scans don't run on
 * every dashboard load.
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

  const [sections, scrollDepth, clicks, funnel] = await Promise.all([
    getSectionEngagement(),
    getScrollDepth(),
    getCtaClicks(),
    getContactFunnel(),
  ]);

  return NextResponse.json({ sections, scrollDepth, clicks, funnel });
}
