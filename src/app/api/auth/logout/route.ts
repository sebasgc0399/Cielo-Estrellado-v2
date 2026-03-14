import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'
import {
  verifySessionCookie,
  getClearSessionCookieOptions,
  COOKIE_NAME,
} from '@/lib/auth/session'

export async function POST() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value

  if (sessionCookie) {
    try {
      const decoded = await verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decoded.uid)
    } catch {
      // Cookie invalid or expired — still clear it
    }
  }

  cookieStore.set(getClearSessionCookieOptions())

  return NextResponse.json({ status: 'ok' })
}
