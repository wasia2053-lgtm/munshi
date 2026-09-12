import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Fail-open on infra hiccups — don't lock everyone out if Supabase itself is down.
async function checkAdminLoginAttempt(ip: string): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/check_admin_login_attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_ip: ip }),
    })
    if (!res.ok) return true
    return await res.json()
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const path = request.nextUrl.pathname

  // ─── Admin panel: separate WordPress-style login, no Munshi account needed ───
  if (path.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization')
    const validUser = process.env.ADMIN_USERNAME
    const validPass = process.env.ADMIN_PASSWORD
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const unauthorized = () =>
      new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Munshi Admin"' },
      })

    // Brute-force lockout — max 5 attempts per IP per 5 minutes, checked
    // before we even look at the credentials.
    if (!(await checkAdminLoginAttempt(ip))) {
      return new NextResponse('Too many login attempts. Please try again in a few minutes.', { status: 429 })
    }

    if (!validUser || !validPass) {
      console.error('ADMIN_USERNAME / ADMIN_PASSWORD not set in env')
      return unauthorized()
    }

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return unauthorized()
    }

    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
    const [user, pass] = decoded.split(':')

    if (user !== validUser || pass !== validPass) {
      return unauthorized()
    }
    // credentials good — fall through, let the page load
  }

  // ⚡️ FAST PASS: Bypass heavy middleware network calls for internal API routes
  // This prevents Turbopack concurrent connection panics and drops API response times to ms
  if (path.startsWith('/api/')) {
    return response
  }

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
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Protect dashboard routes
  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Email confirmation guard
  if (
    user &&
    !user.email_confirmed_at &&
    path.startsWith('/dashboard') &&
    path !== '/dashboard'
  ) {
    return NextResponse.redirect(new URL('/verify-email', request.url))
  }

  // 3. Prevent logged-in users from visiting auth pages
  if (user && (path === '/auth/login' || path === '/auth/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/whatsapp/webhook).*)'],
}