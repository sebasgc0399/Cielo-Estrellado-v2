'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SessionUser } from '@/lib/auth/types'
import type { GetUserSkiesResult } from '@/lib/skies/getUserSkies'
import styles from './page.module.css'

interface AppContentProps {
  user: SessionUser
  skiesResult: GetUserSkiesResult
}

function extractConsoleUrl(error: string): string | null {
  const match = error.match(/https:\/\/[^\s]+/)
  if (!match) return null

  return match[0].replace(/[),.;]+$/, '')
}

function getSkyLoadErrorState(error: string): {
  description: string
  details: string | null
  consoleUrl: string | null
} {
  const consoleUrl = extractConsoleUrl(error)

  if (consoleUrl) {
    return {
      description: 'Este entorno todavia no tiene el indice de Firestore necesario para cargar tus cielos.',
      details: 'Crea el indice en Firebase Console, espera a que termine de construir y luego vuelve a intentar.',
      consoleUrl,
    }
  }

  return {
    description: 'Intenta recargar la pagina. Si el problema persiste, revisa tu conexion o la configuracion de Firebase.',
    details: error || null,
    consoleUrl: null,
  }
}

export function AppContent({ user, skiesResult }: AppContentProps) {
  const router = useRouter()
  const greeting = user.displayName ? `Hola, ${user.displayName}` : 'Hola'

  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('El título es obligatorio')
      return
    }
    if (trimmed.length > 100) {
      setError('El título no puede superar 100 caracteres')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/skies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Error al crear el cielo')
        return
      }

      setIsCreating(false)
      setTitle('')
      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    setIsCreating(false)
    setTitle('')
    setError(null)
  }

  function renderCreateForm() {
    return (
      <div className={styles.createForm}>
        <input
          type="text"
          className={styles.titleInput}
          placeholder="Nombre de tu cielo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSubmitting) handleCreate()
            if (e.key === 'Escape') handleCancel()
          }}
          disabled={isSubmitting}
          maxLength={100}
          autoFocus
        />
        {error && <p className={styles.errorMsg}>{error}</p>}
        <div className={styles.formActions}>
          <button
            className={styles.ctaBtnEnabled}
            onClick={handleCreate}
            disabled={isSubmitting}
            type="button"
          >
            {isSubmitting ? 'Creando…' : 'Crear'}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isSubmitting}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  const roleLabels: Record<string, string> = {
    owner: 'Propietario',
    editor: 'Editor',
    viewer: 'Espectador',
    legacy_claimant: 'Legacy',
  }

  const loadErrorState = !skiesResult.ok ? getSkyLoadErrorState(skiesResult.error) : null

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.greeting}>{greeting}</h1>
      </section>

      {!user.emailVerified && (
        <div className={styles.emailBanner} role="alert">
          Verifica tu email para acceder a todas las funciones.
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Tus cielos</h2>

        {!skiesResult.ok ? (
          <div className={styles.errorState} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">!</span>
            <p className={styles.errorTitle}>No se pudieron cargar tus cielos</p>
            <p className={styles.errorText}>
              {loadErrorState?.description}
            </p>
            {loadErrorState?.details && (
              <p className={styles.errorHint}>{loadErrorState.details}</p>
            )}
            <div className={styles.errorActions}>
              {loadErrorState?.consoleUrl && (
                <a
                  className={styles.consoleLink}
                  href={loadErrorState.consoleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir indice en Firebase
                </a>
              )}
              <button
                className={styles.retryBtn}
                onClick={() => router.refresh()}
                type="button"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : skiesResult.skies.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">✦</span>
            <p className={styles.emptyTitle}>Aún no tienes un cielo</p>
            <p className={styles.emptyText}>
              Un cielo es tu espacio personal de recuerdos y estrellas.
            </p>
            {isCreating ? (
              renderCreateForm()
            ) : (
              <button
                className={styles.ctaBtnEnabled}
                onClick={() => setIsCreating(true)}
                type="button"
              >
                Crear mi primer cielo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.skyList}>
              {skiesResult.skies.map((entry) => (
                <Link key={entry.skyId} href={`/app/cielos/${entry.skyId}`} className={styles.skyCard}>
                  <span className={styles.skyCardTitle}>{entry.sky.title}</span>
                  <div className={styles.skyCardMeta}>
                    <span className={styles.roleBadge}>
                      {roleLabels[entry.role] || entry.role}
                    </span>
                    <span className={styles.skyCardDate}>
                      {new Date(entry.sky.createdAt).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {isCreating ? (
              renderCreateForm()
            ) : (
              <button
                className={styles.secondaryBtn}
                onClick={() => setIsCreating(true)}
                type="button"
              >
                Crear nuevo cielo
              </button>
            )}
          </>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.legacyCard}>
          <span className={styles.legacyCardLabel}>Cielo heredado</span>
          <p className={styles.legacyCardText}>
            Tu cielo heredado ya esta disponible con todas las estrellas del sistema anterior.
          </p>
          <Link href="/app/cielos/shared-legacy-v1" className={styles.legacyCardBtn}>
            Ver cielo heredado
          </Link>
        </div>
      </section>
    </div>
  )
}
