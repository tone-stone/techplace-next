import { createBrowserClient } from '@supabase/ssr'

/**
 * One of four Supabase client factories in this directory, each scoped to a
 * different execution context — see server.ts (server component/action,
 * cookie-bound), admin.ts (service-role), public.ts (anon, no cookies) for
 * the others. This one is for Client Components: it reads/writes the
 * Supabase auth cookies via the browser's own `document.cookie`, so the
 * session it sees stays in sync with whatever the server side set.
 */

/** Browser-side Supabase client backed by the anon key, for use in Client Components. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
