import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  if (!user && isUnderPath('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user && isUnderPath('/blog/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/blog/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
