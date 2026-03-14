import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import {
  createSessionCookie,
  getSessionCookieOptions,
} from '@/lib/auth/session'
import type { UserRecord } from '@/domain/contracts'

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string }

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 },
      )
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const sessionCookie = await createSessionCookie(idToken)

    const userRef = adminDb.collection('users').doc(decodedToken.uid)
    const userSnap = await userRef.get()
    const firebaseUser = await adminAuth.getUser(decodedToken.uid)
    const now = new Date().toISOString()

    if (userSnap.exists) {
      const existing = userSnap.data() as UserRecord

      // emailVerifiedAt: only set when transitioning from null → verified.
      // Once set, preserve the original timestamp.
      const emailVerifiedAt =
        existing.emailVerifiedAt !== null
          ? existing.emailVerifiedAt
          : firebaseUser.emailVerified
            ? now
            : null

      await userRef.update({
        email: firebaseUser.email || existing.email,
        displayName: firebaseUser.displayName || null,
        photoURL: firebaseUser.photoURL || null,
        providers: firebaseUser.providerData.map((p) => p.providerId),
        emailVerifiedAt,
        lastLoginAt: now,
      })
    } else {
      const newUser: UserRecord = {
        displayName: firebaseUser.displayName || null,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || null,
        providers: firebaseUser.providerData.map((p) => p.providerId),
        emailVerifiedAt: firebaseUser.emailVerified ? now : null,
        createdAt: now,
        lastLoginAt: now,
        status: 'active',
        sessionVersion: 1,
      }

      await userRef.set(newUser)
    }

    const cookieStore = await cookies()
    cookieStore.set(getSessionCookieOptions(sessionCookie))

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Session creation failed:', error)
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  }
}
