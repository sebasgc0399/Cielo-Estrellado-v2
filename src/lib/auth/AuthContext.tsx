'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase/client'

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Throws if the session endpoint responds with an error.
// Callers decide whether to propagate or swallow the error.
async function syncSessionCookie(firebaseUser: User): Promise<void> {
  const idToken = await firebaseUser.getIdToken()
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!response.ok) {
    throw new Error(`Session sync failed: ${response.status}`)
  }
}

function toAuthUser(firebaseUser: User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    emailVerified: firebaseUser.emailVerified,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onIdTokenChanged covers both boot (if Firebase has an active session)
    // and automatic ID token renewals (~every hour). This is the mechanism
    // for rolling renewal: each token refresh triggers a fresh session cookie.
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await syncSessionCookie(firebaseUser)
        } catch {
          // Background sync failure — do not break the app.
          // The existing session cookie remains valid until it expires.
        }
        setUser(toAuthUser(firebaseUser))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Explicit auth actions: syncSessionCookie errors propagate to the UI.
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    await syncSessionCookie(credential.user)
    setUser(toAuthUser(credential.user))
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await syncSessionCookie(credential.user)
    setUser(toAuthUser(credential.user))
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup(firebaseAuth, provider)
    await syncSessionCookie(credential.user)
    setUser(toAuthUser(credential.user))
  }, [])

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await firebaseSignOut(firebaseAuth)
    setUser(null)
  }, [])

  return (
    <AuthContext value={{
      user,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
