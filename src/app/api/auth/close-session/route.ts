import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Hit via navigator.sendBeacon when the redactor portal tab/window closes,
// so the session doesn't outlive the tab it was opened in.
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
