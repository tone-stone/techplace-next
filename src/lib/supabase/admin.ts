import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * One of four Supabase client factories in this directory, each scoped to a
 * different execution context — see client.ts (browser), server.ts (server
 * component/action, cookie-bound), public.ts (anon, no cookies) for the
 * others. This one wraps the service-role key, which bypasses Row Level
 * Security entirely, so it must only ever run in trusted server code that
 * has already authorized the caller itself (e.g. user management actions
 * gated by `requireUserManager`) — it performs no auth/RLS checks of its own.
 */

/**
 * Service-role client for privileged, server-only operations (creating/deleting
 * auth users, bypassing RLS for admin writes). Never import this from client code.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
