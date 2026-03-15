'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SkyRecord, MemberRecord, MemberRole, SkySource } from '@/domain/contracts'
import type { StarEntry } from '@/lib/skies/getSkyStars'
import styles from './SkyDetailContent.module.css'

interface SkyDetailContentProps {
  skyId: string
  sky: SkyRecord
  member: MemberRecord
  stars: StarEntry[]
  starsError: string | null
  canCreate: boolean
}

const roleLabels: Record<MemberRole, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Espectador',
  legacy_claimant: 'Legacy',
}

const sourceLabels: Record<SkySource, string> = {
  native: 'Nativo',
  legacy_import: 'Importado',
}

export function SkyDetailContent({
  skyId,
  sky,
  member,
  stars,
  starsError,
  canCreate,
}: SkyDetailContentProps) {
  const router = useRouter()

  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('El titulo es obligatorio')
      return
    }
    if (trimmedTitle.length > 200) {
      setError('El titulo no puede superar 200 caracteres')
      return
    }
    const trimmedMessage = message.trim()
    if (trimmedMessage.length > 2000) {
      setError('El mensaje no puede superar 2000 caracteres')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/skies/${skyId}/stars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          message: trimmedMessage || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Error al crear la estrella')
        return
      }

      setIsCreating(false)
      setTitle('')
      setMessage('')
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
    setMessage('')
    setError(null)
  }

  function renderCreateForm() {
    return (
      <div className={styles.createForm}>
        <input
          type="text"
          className={styles.titleInput}
          placeholder="Nombre de la estrella"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSubmitting) handleCreate()
            if (e.key === 'Escape') handleCancel()
          }}
          disabled={isSubmitting}
          maxLength={200}
          autoFocus
        />
        <textarea
          className={styles.messageInput}
          placeholder="Mensaje o recuerdo (opcional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
          maxLength={2000}
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

  function renderStarsContent() {
    if (starsError) {
      return (
        <div className={styles.errorState} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">!</span>
          <p className={styles.errorTitle}>No se pudieron cargar las estrellas</p>
          <p className={styles.errorText}>
            Intenta recargar la pagina. Si el problema persiste, revisa tu conexion.
          </p>
          <button
            className={styles.retryBtn}
            onClick={() => router.refresh()}
            type="button"
          >
            Reintentar
          </button>
        </div>
      )
    }

    if (stars.length === 0) {
      return (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">✦</span>
          <p className={styles.emptyTitle}>
            {canCreate ? 'Tu cielo esta vacio' : 'Este cielo aun no tiene estrellas'}
          </p>
          <p className={styles.emptyText}>
            {canCreate
              ? 'Crea tu primera estrella para empezar a llenar este cielo de recuerdos.'
              : 'Las estrellas de este cielo apareceran aqui.'}
          </p>
          {canCreate && (
            isCreating ? (
              renderCreateForm()
            ) : (
              <button
                className={styles.ctaBtnEnabled}
                onClick={() => setIsCreating(true)}
                type="button"
              >
                Crear primera estrella
              </button>
            )
          )}
        </div>
      )
    }

    return (
      <>
        <div className={styles.starList}>
          {stars.map((entry) => (
            <div key={entry.starId} className={styles.starCard}>
              <p className={styles.starTitle}>
                {entry.star.title || 'Sin titulo'}
              </p>
              {entry.star.message && (
                <p className={styles.starMessage}>{entry.star.message}</p>
              )}
              <p className={styles.starDate}>
                {new Date(entry.star.createdAt).toLocaleDateString('es', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
        {canCreate && (
          isCreating ? (
            renderCreateForm()
          ) : (
            <button
              className={styles.secondaryBtn}
              onClick={() => setIsCreating(true)}
              type="button"
            >
              Crear nueva estrella
            </button>
          )
        )}
      </>
    )
  }

  return (
    <div className={styles.page}>
      <Link href="/app" className={styles.backLink}>
        ← Mis cielos
      </Link>

      <section className={styles.header}>
        <h1 className={styles.title}>{sky.title}</h1>
        <div className={styles.badges}>
          <span className={styles.badge}>{roleLabels[member.role]}</span>
          <span className={styles.badge}>Privado</span>
          <span className={styles.badge}>{sourceLabels[sky.source]}</span>
        </div>
        <p className={styles.meta}>
          Creado el{' '}
          {new Date(sky.createdAt).toLocaleDateString('es', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </section>

      <section className={styles.starsSection}>
        <h2 className={styles.sectionLabel}>
          Estrellas{!starsError && stars.length > 0 ? ` (${stars.length})` : ''}
        </h2>
        {renderStarsContent()}
      </section>
    </div>
  )
}
