import { createServerClient } from '@supabase/ssr'
import { NextResponse, after, type NextRequest } from 'next/server'
import { ACTIVITY_COOKIE, IDLE_TIMEOUT_MS } from '@/lib/auth/session'
import { logSlowOperation } from '@/lib/monitoring/server'
import { canOpenDashboard, type ProfileRole } from '@/lib/auth/roles'

/**
 * Next.js middleware (Edge runtime), run on every request matched by
 * `config.matcher` below. Only `/admin*` gates on auth; every other request
 * short-circuits before the Supabase round trip so this stays cheap on the
 * common path.
 *
 * For `/admin*` it enforces, in order:
 *  1. A signed-in account with a valid dashboard role (`canOpenDashboard`).
 *     Which modules that role actually sees is decided by the RSC page and
 *     the per-action gates, not here.
 *  2. A 30-minute inactivity timeout, tracked via a rolling `ACTIVITY_COOKIE`
 *     timestamp: if it's stale the auth cookies are wiped and the user is
 *     bounced to `/login?expired=1`; otherwise the timestamp slides forward.
 *
 * Auth-check duration is measured and reported via `logSlowOperation` when it
 * exceeds `SLOW_AUTH_CHECK_MS`, since this runs on every gated page load.
 */

const SLOW_AUTH_CHECK_MS = 300
const LOGIN_PATH = '/login'

export async function proxy(request: NextRequest) {
  const isUnderPath = (base: string) =>
    request.nextUrl.pathname === base || request.nextUrl.pathname.startsWith(`${base}/`)

  // Only /admin gates on auth — skip the Supabase round trip on every other route.
  if (!isUnderPath('/admin')) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            // Session-only cookie: no maxAge/expires, so the browser drops the
            // login when the browser (or tab session) actually closes.
            response.cookies.set(name, value, { ...options, maxAge: undefined, expires: undefined })
          )
        },
      },
    }
  )

  const authCheckStart = performance.now()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: ProfileRole | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).is('deleted_at', null).single()
    profile = data as ProfileRole | null
  }

  const authCheckDuration = performance.now() - authCheckStart
  if (authCheckDuration >= SLOW_AUTH_CHECK_MS) {
    after(() =>
      logSlowOperation({
        label: 'proxy.authCheck',
        durationMs: authCheckDuration,
        path: request.nextUrl.pathname,
      })
    )
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    return NextResponse.redirect(url)
  }

  // No profile or a role that can't open the dashboard: bounce to login.
  if (!profile || !canOpenDashboard(profile)) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    return NextResponse.redirect(url)
  }

  // Inactivity timeout: if the rolling "last seen" stamp is older than the
  // window, drop the session and bounce to /login?expired=1. Otherwise slide
  // the window forward.
  const now = Date.now()
  const seen = Number(request.cookies.get(ACTIVITY_COOKIE)?.value)
  if (Number.isFinite(seen) && now - seen > IDLE_TIMEOUT_MS) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = '?expired=1'
    const expiredRes = NextResponse.redirect(url)
    for (const c of request.cookies.getAll()) {
      if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) {
        expiredRes.cookies.delete(c.name)
      }
    }
    expiredRes.cookies.delete(ACTIVITY_COOKIE)
    return expiredRes
  }

  response.cookies.set(ACTIVITY_COOKIE, String(now), {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

/** Runs the proxy on all paths except Next static assets and common image files. */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
