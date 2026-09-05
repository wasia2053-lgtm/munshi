import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

    const unauthorized = () =>
      new NextResponse('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Munshi Admin"' },
      })

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