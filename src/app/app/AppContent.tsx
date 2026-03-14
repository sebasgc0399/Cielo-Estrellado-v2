'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import type { SessionUser } from '@/lib/auth/types'

interface AppContentProps {
  user: SessionUser
}

export function AppContent({ user }: AppContentProps) {
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
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Cielo Estrellado</h1>
        <p style={styles.subtitle}>Sesion activa</p>

        <div style={styles.info}>
          <div style={styles.row}>
            <span style={styles.label}>UID</span>
            <span style={styles.valueMono}>{user.uid}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{user.email}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Nombre</span>
            <span style={styles.value}>{user.displayName ?? '\u2014'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Email verificado</span>
            <span style={styles.value}>{user.emailVerified ? 'Si' : 'No'}</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            ...styles.button,
            opacity: signingOut ? 0.6 : 1,
            cursor: signingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {signingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
        </button>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a1a',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    padding: '2rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 600,
    textAlign: 'center' as const,
    margin: '0 0 0.25rem',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    margin: '0 0 1.5rem',
  },
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '1rem',
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  value: {
    color: '#fff',
    fontSize: '0.8rem',
    textAlign: 'right' as const,
    wordBreak: 'break-all' as const,
  },
  valueMono: {
    color: '#fff',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textAlign: 'right' as const,
    wordBreak: 'break-all' as const,
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
}
