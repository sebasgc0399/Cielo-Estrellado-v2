'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SkyRecord, MemberRecord, MemberRole, SkySource, StarRecord } from '@/domain/contracts'
import type { StarEntry } from '@/lib/skies/getSkyStars'
import styles from './SkyDetailContent.module.css'

interface SkyDetailContentProps {
  skyId: string
  sky: SkyRecord
  member: MemberRecord
  userId: string
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
  userId,
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

  const [editingStarId, setEditingStarId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingStarId, setDeletingStarId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function canEditStar(star: StarRecord): boolean {
    return (
      member.role === 'owner' ||
      (member.role === 'editor' && star.authorUserId === userId)
    )
  }

  function canDeleteStar(star: StarRecord): boolean {
    return (
      member.role === 'owner' ||
      (member.role === 'editor' && star.authorUserId === userId)
    )
  }

  function openCreate() {
    if (isSubmitting || editSubmitting || deleteSubmitting) return
    setEditingStarId(null)
    setEditTitle('')
    setEditMessage('')
    setEditError(null)
    setDeletingStarId(null)
    setDeleteError(null)
    setIsCreating(true)
  }

  function openEdit(entry: StarEntry) {
    if (isSubmitting || editSubmitting || deleteSubmitting) return
    setIsCreating(false)
    setTitle('')
    setMessage('')
    setError(null)
    setDeletingStarId(null)
    setDeleteError(null)
    setEditingStarId(entry.starId)
    setEditTitle(entry.star.title ?? '')
    setEditMessage(entry.star.message ?? '')
    setEditError(null)
  }

  function openDelete(starId: string) {
    if (isSubmitting || editSubmitting || deleteSubmitting) return
    setIsCreating(false)
    setTitle('')
    setMessage('')
    setError(null)
    setEditingStarId(null)
    setEditTitle('')
    setEditMessage('')
    setEditError(null)
    setDeletingStarId(starId)
    setDeleteError(null)
  }

  function cancelDelete() {
    setDeletingStarId(null)
    setDeleteError(null)
  }

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

  async function handleEditSave(starId: string) {
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      setEditError('El titulo es obligatorio')
      return
    }
    if (trimmedTitle.length > 200) {
      setEditError('El titulo no puede superar 200 caracteres')
      return
    }
    const trimmedMessage = editMessage.trim()
    if (trimmedMessage.length > 2000) {
      setEditError('El mensaje no puede superar 2000 caracteres')
      return
    }

    setEditSubmitting(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/skies/${skyId}/stars/${starId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          message: trimmedMessage || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setEditError(data?.error || 'Error al guardar los cambios')
        return
      }

      setEditingStarId(null)
      setEditTitle('')
      setEditMessage('')
      router.refresh()
    } catch {
      setEditError('No se pudo conectar con el servidor')
    } finally {
      setEditSubmitting(false)
    }
  }

  function handleEditCancel() {
    setEditingStarId(null)
    setEditTitle('')
    setEditMessage('')
    setEditError(null)
  }

  async function handleDeleteConfirm(starId: string) {
    setDeleteSubmitting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/skies/${skyId}/stars/${starId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setDeleteError(data?.error || 'Error al eliminar la estrella')
        return
      }
      setDeletingStarId(null)
      router.refresh()
    } catch {
      setDeleteError('No se pudo conectar con el servidor')
    } finally {
      setDeleteSubmitting(false)
    }
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

  function renderEditForm(starId: string) {
    return (
      <div className={styles.editForm}>
        <input
          type="text"
          className={styles.titleInput}
          placeholder="Nombre de la estrella"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !editSubmitting) handleEditSave(starId)
            if (e.key === 'Escape') handleEditCancel()
          }}
          disabled={editSubmitting}
          maxLength={200}
          autoFocus
        />
        <textarea
          className={styles.messageInput}
          placeholder="Mensaje o recuerdo (opcional)"
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          disabled={editSubmitting}
          maxLength={2000}
        />
        {editError && <p className={styles.errorMsg}>{editError}</p>}
        <div className={styles.formActions}>
          <button
            className={styles.ctaBtnEnabled}
            onClick={() => handleEditSave(starId)}
            disabled={editSubmitting}
            type="button"
          >
            {editSubmitting ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            className={styles.cancelBtn}
            onClick={handleEditCancel}
            disabled={editSubmitting}
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
                onClick={openCreate}
                type="button"
              >
                Crear primera estrella
              </button>
            )
          )}
        </div>
      )
    }

    const idle =
      !isCreating && !isSubmitting &&
      editingStarId === null && !editSubmitting &&
      deletingStarId === null && !deleteSubmitting

    return (
      <>
        <div className={styles.starList}>
          {stars.map((entry) => (
            <div key={entry.starId} className={styles.starCard}>
              {editingStarId === entry.starId ? (
                renderEditForm(entry.starId)
              ) : (
                <>
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
                  {idle && canEditStar(entry.star) && (
                    <button
                      className={styles.editBtn}
                      onClick={() => openEdit(entry)}
                      type="button"
                    >
                      Editar
                    </button>
                  )}
                  {idle && canDeleteStar(entry.star) && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => openDelete(entry.starId)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  )}
                  {deletingStarId === entry.starId && (
                    <div className={styles.deleteConfirm}>
                      <span className={styles.deleteConfirmText}>
                        ¿Eliminar esta estrella?
                      </span>
                      {deleteError && (
                        <p className={styles.errorMsg}>{deleteError}</p>
                      )}
                      <div className={styles.deleteConfirmActions}>
                        <button
                          className={styles.deleteConfirmBtn}
                          onClick={() => handleDeleteConfirm(entry.starId)}
                          disabled={deleteSubmitting}
                          type="button"
                        >
                          {deleteSubmitting ? 'Eliminando…' : 'Eliminar'}
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={cancelDelete}
                          disabled={deleteSubmitting}
                          type="button"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        {isCreating && renderCreateForm()}
        {canCreate && idle && (
          <button
            className={styles.secondaryBtn}
            onClick={openCreate}
            type="button"
          >
            Crear nueva estrella
          </button>
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
