import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Anon-key client for public, unauthenticated reads (published articles) that
 * doesn't touch `cookies()`. The cookie-bound client in `server.ts` is a
 * Request-time API — using it anywhere in a page forces that whole route to
 * render dynamically on every request, which is why /blog and /blog/[slug]
 * couldn't be cached. Reads here run as the same "anon" Postgres role as an
 * unauthenticated cookie session, so RLS behaves identically; this is only
 * safe for queries that don't depend on `auth.getUser()`.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
