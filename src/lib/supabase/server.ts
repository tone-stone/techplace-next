import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
