'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import styles from './page.module.css'

export default function SignOutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/login')
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      className={styles.signOutBtn}
      type="button"
    >
      {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  )
}
