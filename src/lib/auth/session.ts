import 'server-only'

import { adminAuth } from '@/lib/firebase/admin'
import {
  SESSION_COOKIE_TTL_MS,
  SESSION_COOKIE_SAME_SITE,
} from '@/domain/policies'

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'cielo_session'

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_TTL_MS,
  })
}

export async function verifySessionCookie(cookie: string) {
  return adminAuth.verifySessionCookie(cookie, true)
}

export function getSessionCookieOptions(sessionCookie: string) {
  return {
    name: COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: SESSION_COOKIE_SAME_SITE,
    path: '/',
    maxAge: SESSION_COOKIE_TTL_MS / 1000,
  } as const
}

export function getClearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: SESSION_COOKIE_SAME_SITE,
    path: '/',
    maxAge: 0,
  } as const
}

export { COOKIE_NAME }
