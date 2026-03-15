'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SkyRecord, MemberRecord, MemberRole, SkySource, StarRecord } from '@/domain/contracts'
import type { StarEntry } from '@/lib/skies/getSkyStars'
import type { UserStar } from '@/engine/SkyEngine'
import { SkyCanvasPreview } from './SkyCanvasPreview'
import { StarImage } from '@/components/StarImage'
import { CollaboratorsPanel } from './CollaboratorsPanel'
import { uploadStarImage } from '@/lib/firebase/storage'
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

  const [createX, setCreateX] = useState<number | null>(null)
  const [createY, setCreateY] = useState<number | null>(null)

  const [editingStarId, setEditingStarId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [editX, setEditX] = useState<number | null>(null)
  const [editY, setEditY] = useState<number | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null)
  const [editImageError, setEditImageError] = useState<string | null>(null)

  const [deletingStarId, setDeletingStarId] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [flashingStarId, setFlashingStarId] = useState<string | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)

  const createFormRef = useRef<HTMLDivElement | null>(null)

  function clearEditImageState() {
    if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
    setEditImageFile(null)
    setEditImagePreviewUrl(null)
    setEditImageError(null)
  }

  useEffect(() => {
    return () => {
      if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
    }
  }, [editImagePreviewUrl])

  useEffect(() => {
    if (!flashingStarId) return
    const timer = setTimeout(() => setFlashingStarId(null), 800)
    return () => clearTimeout(timer)
  }, [flashingStarId])

  useEffect(() => {
    if (isCreating && createX !== null) {
      createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [isCreating, createX])

  const userStars: UserStar[] = useMemo(
    () =>
      stars
        .filter(e => e.star.xNormalized != null && e.star.yNormalized != null)
        .map(e => ({
          id: e.starId,
          x: e.star.xNormalized!,
          y: e.star.yNormalized!,
        })),
    [stars],
  )

  function handleStarClick(starId: string) {
    const el = document.getElementById(`star-${starId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    setFlashingStarId(starId)
  }

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

  const draggableStarIds = useMemo((): Set<string> => {
    if (isCreating || editingStarId !== null || isCommitting) return new Set()
    const ids = new Set<string>()
    for (const entry of stars) {
      if (
        entry.star.xNormalized !== null &&
        entry.star.title !== null &&
        entry.star.title.trim() !== '' &&
        canEditStar(entry.star)
      ) ids.add(entry.starId)
    }
    return ids
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars, isCreating, editingStarId, isCommitting, member.role, userId])

  async function handleStarDrop(starId: string, nx: number, ny: number): Promise<boolean> {
    const entry = stars.find(e => e.starId === starId)
    if (!entry) return false
    setIsCommitting(true)
    try {
      const res = await fetch(`/api/skies/${skyId}/stars/${starId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entry.star.title ?? '',
          message: entry.star.message ?? undefined,
          xNormalized: nx,
          yNormalized: ny,
        }),
      })
      if (!res.ok) {
        router.refresh()
        return false
      }
      router.refresh()
      return true
    } catch {
      router.refresh()
      return false
    } finally {
      setIsCommitting(false)
    }
  }

  function handleStarDragCancel(_starId: string) {
    // SkyCanvas already reverted engine.setUserStars before calling this.
  }

  function openCreate(initialX?: number, initialY?: number) {
    if (isSubmitting || editSubmitting || deleteSubmitting) return
    clearEditImageState()
    setEditingStarId(null)
    setEditTitle('')
    setEditMessage('')
    setEditX(null)
    setEditY(null)
    setEditError(null)
    setDeletingStarId(null)
    setDeleteError(null)
    setCreateX(initialX ?? null)
    setCreateY(initialY ?? null)
    setIsCreating(true)
  }

  function handleEmptySpaceClick(x: number, y: number) {
    if (!canCreate) return
    if (isCreating || editingStarId !== null || deletingStarId !== null) return
    if (isSubmitting || editSubmitting || deleteSubmitting || isCommitting) return
    openCreate(x, y)
  }

  function openEdit(entry: StarEntry) {
    if (isSubmitting || editSubmitting || deleteSubmitting) return
    clearEditImageState()
    setIsCreating(false)
    setTitle('')
    setMessage('')
    setCreateX(null)
    setCreateY(null)
    setError(null)
    setDeletingStarId(null)
    setDeleteError(null)
    setEditingStarId(entry.starId)
    setEditTitle(entry.star.title ?? '')
    setEditMessage(entry.star.message ?? '')
    setEditX(entry.star.xNormalized)
    setEditY(entry.star.yNormalized)
    setEditError(null)
  }

  function openDelete(starId: string) {
    if (isSubmitting || editSubmitting || deleteSubmitting) return
    clearEditImageState()
    setIsCreating(false)
    setTitle('')
    setMessage('')
    setCreateX(null)
    setCreateY(null)
    setError(null)
    setEditingStarId(null)
    setEditTitle('')
    setEditMessage('')
    setEditX(null)
    setEditY(null)
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
    if ((createX !== null) !== (createY !== null)) {
      setError('Completa ambas coordenadas o quita la posicion')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload: Record<string, unknown> = {
        title: trimmedTitle,
        message: trimmedMessage || undefined,
      }
      if (createX !== null && createY !== null) {
        payload.xNormalized = createX
        payload.yNormalized = createY
      }

      const res = await fetch(`/api/skies/${skyId}/stars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Error al crear la estrella')
        return
      }

      setIsCreating(false)
      setTitle('')
      setMessage('')
      setCreateX(null)
      setCreateY(null)
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
    setCreateX(null)
    setCreateY(null)
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
    if ((editX !== null) !== (editY !== null)) {
      setEditError('Completa ambas coordenadas o quita la posicion')
      return
    }

    setEditSubmitting(true)
    setEditError(null)

    try {
      let uploadedPath: string | undefined
      if (editImageFile) {
        try {
          uploadedPath = await uploadStarImage(skyId, starId, editImageFile)
        } catch {
          setEditError('Error al subir la imagen')
          return
        }
      }

      const patchBody: Record<string, unknown> = {
        title: trimmedTitle,
        message: trimmedMessage || undefined,
        xNormalized: editX,
        yNormalized: editY,
      }
      if (uploadedPath !== undefined) {
        patchBody.imagePath = uploadedPath
      }

      const res = await fetch(`/api/skies/${skyId}/stars/${starId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setEditError(data?.error || 'Error al guardar los cambios')
        return
      }

      clearEditImageState()
      setEditingStarId(null)
      setEditTitle('')
      setEditMessage('')
      setEditX(null)
      setEditY(null)
      router.refresh()
    } catch {
      setEditError('No se pudo conectar con el servidor')
    } finally {
      setEditSubmitting(false)
    }
  }

  function handleEditCancel() {
    clearEditImageState()
    setEditingStarId(null)
    setEditTitle('')
    setEditMessage('')
    setEditX(null)
    setEditY(null)
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
      <div className={styles.createForm} ref={createFormRef}>
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
        <div className={styles.coordRow}>
          <label className={styles.coordLabel}>
            X%
            <input
              type="number"
              className={styles.coordInput}
              min={0}
              max={100}
              step={1}
              value={createX !== null ? Math.round(createX * 100) : ''}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setCreateX(null); return }
                const v = Number(raw)
                if (!Number.isNaN(v)) setCreateX(Math.min(100, Math.max(0, v)) / 100)
              }}
              disabled={isSubmitting}
              placeholder="—"
            />
          </label>
          <label className={styles.coordLabel}>
            Y%
            <input
              type="number"
              className={styles.coordInput}
              min={0}
              max={100}
              step={1}
              value={createY !== null ? Math.round(createY * 100) : ''}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setCreateY(null); return }
                const v = Number(raw)
                if (!Number.isNaN(v)) setCreateY(Math.min(100, Math.max(0, v)) / 100)
              }}
              disabled={isSubmitting}
              placeholder="—"
            />
          </label>
        </div>
        <p className={styles.coordinateHint}>
          {createX !== null && createY !== null ? (
            <>
              Posicion: ({createX.toFixed(2)}, {createY.toFixed(2)})
              <button
                className={styles.removePositionBtn}
                onClick={() => { setCreateX(null); setCreateY(null) }}
                disabled={isSubmitting}
                type="button"
              >
                Quitar
              </button>
            </>
          ) : (createX !== null || createY !== null) ? (
            'Completa ambas coordenadas o quita la posicion'
          ) : (
            'Sin posicion — usa el canvas o ingresa coordenadas'
          )}
        </p>
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
    const editingEntry = stars.find(e => e.starId === starId)
    const star = editingEntry?.star
    const hasStorageImage = !!star?.imagePath

    return (
      <div className={styles.editForm}>
        {star && (
          <div className={styles.imageSection}>
            {hasStorageImage ? (
              <StarImage
                imagePath={star.imagePath}
                legacyUrl={star.legacyUrl}
                className={styles.editImagePreview}
              />
            ) : (
              <>
                {star.legacyUrl && !editImagePreviewUrl && (
                  <StarImage
                    imagePath={null}
                    legacyUrl={star.legacyUrl}
                    className={styles.editImagePreview}
                  />
                )}
                {editImagePreviewUrl && (
                  <div className={styles.editImageWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editImagePreviewUrl}
                      alt=""
                      className={styles.editImagePreview}
                    />
                    <span className={styles.editImageBadge}>Sin guardar</span>
                  </div>
                )}
                <label className={styles.imageAttachLabel}>
                  {editImagePreviewUrl ? 'Cambiar imagen' : 'Agregar imagen'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className={styles.imageAttachInput}
                    disabled={editSubmitting}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        setEditImageError('La imagen no puede superar 5 MB')
                        return
                      }
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        setEditImageError('Solo se permiten imágenes JPEG, PNG o WebP')
                        return
                      }
                      if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
                      setEditImageFile(file)
                      setEditImagePreviewUrl(URL.createObjectURL(file))
                      setEditImageError(null)
                    }}
                  />
                </label>
                {editImageError && <p className={styles.errorMsg}>{editImageError}</p>}
              </>
            )}
          </div>
        )}
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
        <div className={styles.coordRow}>
          <label className={styles.coordLabel}>
            X%
            <input
              type="number"
              className={styles.coordInput}
              min={0}
              max={100}
              step={1}
              value={editX !== null ? Math.round(editX * 100) : ''}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setEditX(null); return }
                const v = Number(raw)
                if (!Number.isNaN(v)) setEditX(Math.min(100, Math.max(0, v)) / 100)
              }}
              disabled={editSubmitting}
              placeholder="—"
            />
          </label>
          <label className={styles.coordLabel}>
            Y%
            <input
              type="number"
              className={styles.coordInput}
              min={0}
              max={100}
              step={1}
              value={editY !== null ? Math.round(editY * 100) : ''}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') { setEditY(null); return }
                const v = Number(raw)
                if (!Number.isNaN(v)) setEditY(Math.min(100, Math.max(0, v)) / 100)
              }}
              disabled={editSubmitting}
              placeholder="—"
            />
          </label>
        </div>
        <p className={styles.coordinateHint}>
          {editX !== null && editY !== null ? (
            <>
              Posicion: ({editX.toFixed(2)}, {editY.toFixed(2)})
              <button
                className={styles.removePositionBtn}
                onClick={() => { setEditX(null); setEditY(null) }}
                disabled={editSubmitting}
                type="button"
              >
                Quitar
              </button>
            </>
          ) : (editX !== null || editY !== null) ? (
            'Completa ambas coordenadas o quita la posicion'
          ) : (
            'Sin posicion — usa el canvas o ingresa coordenadas'
          )}
        </p>
        {editError && <p className={styles.errorMsg}>{editError}</p>}
        <div className={styles.formActions}>
          <button
            className={styles.ctaBtnEnabled}
            onClick={() => handleEditSave(starId)}
            disabled={editSubmitting}
            type="button"
          >
            {editSubmitting
              ? editImageFile ? 'Subiendo imagen…' : 'Guardando…'
              : 'Guardar'}
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
                onClick={() => openCreate()}
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
            <div key={entry.starId} id={`star-${entry.starId}`} className={`${styles.starCard} ${flashingStarId === entry.starId ? styles.starCardFlash : ''}`}>
              {editingStarId === entry.starId ? (
                renderEditForm(entry.starId)
              ) : (
                <>
                  <StarImage
                    imagePath={entry.star.imagePath}
                    legacyUrl={entry.star.legacyUrl}
                    className={styles.starThumbnail}
                  />
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
                  <p className={styles.positionStatus}>
                    {entry.star.xNormalized !== null && entry.star.yNormalized !== null
                      ? 'Ubicada'
                      : 'Sin ubicacion'}
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
            onClick={() => openCreate()}
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

        {member.role === 'owner' && (
          <CollaboratorsPanel skyId={skyId} currentUserId={userId} />
        )}
      </section>

      <section className={styles.starsSection}>
        <h2 className={styles.sectionLabel}>
          Estrellas{!starsError && stars.length > 0 ? ` (${stars.length})` : ''}
        </h2>
        <SkyCanvasPreview
          userStars={userStars}
          pickingActive={isCreating || editingStarId !== null}
          selectedPosition={
            isCreating
              ? (createX !== null && createY !== null ? { x: createX, y: createY } : null)
              : (editX !== null && editY !== null ? { x: editX, y: editY } : null)
          }
          onStarClick={handleStarClick}
          onPick={(x: number, y: number) => {
            if (isCreating) { setCreateX(x); setCreateY(y) }
            else if (editingStarId) { setEditX(x); setEditY(y) }
          }}
          onEmptySpaceClick={handleEmptySpaceClick}
          highlightStarId={editingStarId}
          draggableStarIds={draggableStarIds}
          onStarDrop={handleStarDrop}
          onStarDragCancel={handleStarDragCancel}
        />
        {renderStarsContent()}
      </section>
    </div>
  )
}
