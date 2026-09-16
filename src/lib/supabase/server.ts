import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * One of four Supabase client factories in this directory, each scoped to a
 * different execution context — see client.ts (browser), admin.ts
 * (service-role), public.ts (anon, no cookies) for the others. This one is
 * for Server Components and Server Actions: it reads and writes the
 * Supabase auth cookies via `next/headers`, so RLS sees the same signed-in
 * user as the request that hit the server, and a `login()`/`logout()` call
 * can actually mutate the session cookies for the response.
 */

/**
 * Cookie-bound Supabase client for Server Components and Server Actions.
 * @returns A Supabase client whose session is read from and written back to the request's cookies.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // Session-only cookie: no maxAge/expires, so the browser drops the
              // login when the browser (or tab session) actually closes.
              cookieStore.set(name, value, { ...options, maxAge: undefined, expires: undefined })
            )
          } catch {
            // called from a Server Component; middleware refreshes the session instead
          }
        },
      },
    }
  )
}
