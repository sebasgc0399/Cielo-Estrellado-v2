import { NextRequest, NextResponse } from 'next/server'
import {
  verifySessionCookie,
  getClearSessionCookieOptions,
  COOKIE_NAME,
} from '@/lib/auth/session'
import type { SessionUser } from '@/lib/auth/types'

export const runtime = 'nodejs'

export const config = {
  matcher: [
    '/((?!$|demo|login|api/auth|_next/static|_next/image|favicon\\.ico).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value

  if (!sessionCookie) {
    return redirectToLogin(request)
  }

  try {
    // verifySessionCookie with checkRevoked=true is the revocation gate:
    // if revokeRefreshTokens(uid) was called on logout, this throws.
    const decoded = await verifySessionCookie(sessionCookie)

    const sessionUser: SessionUser = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: (decoded.name as string | undefined) ?? null,
      emailVerified: decoded.email_verified ?? false,
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-session-user', JSON.stringify(sessionUser))

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch {
    return clearAndRedirect(request)
  }
}

function redirectToLogin(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

function clearAndRedirect(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    response.cookies.set(getClearSessionCookieOptions())
    return response
  }
  const loginUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(loginUrl)
  response.cookies.set(getClearSessionCookieOptions())
  return response
}
