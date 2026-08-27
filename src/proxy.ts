import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ACTIVITY_COOKIE, IDLE_TIMEOUT_MS } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const isUnderPath = (base: string) =>
    request.nextUrl.pathname === base || request.nextUrl.pathname.startsWith(`${base}/`)

  // Only /admin and /blog/dashboard gate on auth — skip the Supabase round trip
  // (a network call) on every other route so normal pages aren't slowed down by it.
  const needsAuthCheck = isUnderPath('/admin') || isUnderPath('/blog/dashboard')
  if (!needsAuthCheck) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const loginPath = isUnderPath('/admin') ? '/login' : '/blog/login'

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = loginPath
    return NextResponse.redirect(url)
  }

  // Inactivity timeout: if the rolling "last seen" stamp is older than the
  // window, drop the session (wipe the Supabase auth cookies) and bounce to
  // the login screen with ?expired=1. Otherwise slide the window forward.
  const now = Date.now()
  const seen = Number(request.cookies.get(ACTIVITY_COOKIE)?.value)
  if (Number.isFinite(seen) && now - seen > IDLE_TIMEOUT_MS) {
    const url = request.nextUrl.clone()
    url.pathname = loginPath
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

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
