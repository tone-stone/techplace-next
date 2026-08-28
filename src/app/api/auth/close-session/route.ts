import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Beacon endpoint for closing the session when a portal tab/window closes,
 * rather than relying on the session-only cookie surviving until the whole
 * browser quits. Fire-and-forget: the caller doesn't wait on the response.
 */

// Hit via navigator.sendBeacon when the redactor portal tab/window closes,
// so the session doesn't outlive the tab it was opened in.
/** Signs out the current Supabase session server-side. */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
