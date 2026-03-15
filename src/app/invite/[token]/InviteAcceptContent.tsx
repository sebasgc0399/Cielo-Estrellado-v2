'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import type { InvitePreviewResult } from '@/lib/invites/getInviteByToken'

const roleLabels: Record<string, string> = {
  editor: 'Editor',
  viewer: 'Espectador',
}

const invalidReasons: Record<string, string> = {
  not_found: 'Esta invitación no existe o el enlace es incorrecto.',
  expired: 'Esta invitación ha expirado.',
  revoked: 'Esta invitación fue revocada.',
  accepted: 'Esta invitación ya fue aceptada.',
}

interface Props {
  token: string
  preview: InvitePreviewResult
}

export function InviteAcceptContent({ token, preview }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    if (accepting) return
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (res.ok) {
        router.push(`/app/cielos/${data.skyId}`)
        return
      }

      if (res.status === 409 && data?.error === 'already_member' && data?.skyId) {
        router.push(`/app/cielos/${data.skyId}`)
        return
      }

      setError(data?.error || 'No se pudo aceptar la invitación')
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Cielo Estrellado</h1>

        {!preview.valid ? (
          <>
            <p style={styles.subtitle}>Invitación no disponible</p>
            <p style={styles.body}>
              {invalidReasons[preview.reason] ?? 'Este enlace ya no es válido.'}
            </p>
            <Link href="/app" style={styles.link}>
              Ir a mis cielos
            </Link>
          </>
        ) : (
          <>
            <p style={styles.subtitle}>Te han invitado a un cielo</p>

            <div style={styles.previewCard}>
              <p style={styles.skyTitle}>{preview.skyTitle}</p>
              <span style={styles.roleBadge}>
                {roleLabels[preview.role] ?? preview.role}
              </span>
            </div>

            {loading ? null : !user ? (
              <>
                <p style={styles.body}>
                  Inicia sesión para aceptar esta invitación.
                </p>
                <Link
                  href={`/login?redirect=/invite/${token}`}
                  style={styles.button}
                >
                  Iniciar sesión para aceptar
                </Link>
              </>
            ) : (
              <>
                {error && <p style={styles.error}>{error}</p>}
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  style={styles.button}
                  type="button"
                >
                  {accepting ? 'Aceptando…' : 'Aceptar invitación'}
                </button>
              </>
            )}
          </>
        )}
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
    maxWidth: '400px',
    padding: '2rem',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center',
  },
  title: {
    color: '#fff',
    fontSize: '1.4rem',
    fontWeight: 600,
    margin: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.875rem',
    margin: 0,
  },
  previewCard: {
    width: '100%',
    padding: '1.25rem',
    borderRadius: '10px',
    background: 'rgba(143,211,255,0.06)',
    border: '1px solid rgba(143,211,255,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  skyTitle: {
    color: '#e7edff',
    fontSize: '1.1rem',
    fontWeight: 500,
    margin: 0,
  },
  roleBadge: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'rgba(143,211,255,0.08)',
    border: '1px solid rgba(143,211,255,0.18)',
    color: 'rgba(180,220,255,0.7)',
  },
  body: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.85rem',
    margin: 0,
    lineHeight: 1.5,
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
  },
  error: {
    color: '#f87171',
    fontSize: '0.8rem',
    margin: 0,
  },
  link: {
    color: '#60a5fa',
    fontSize: '0.85rem',
    textDecoration: 'underline',
  },
}
