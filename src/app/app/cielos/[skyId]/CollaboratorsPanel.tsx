'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './CollaboratorsPanel.module.css'
import type { MemberRole, InviteRole } from '@/domain/contracts'

interface MemberEntry {
  userId: string
  role: MemberRole
  joinedAt: string
  displayName: string
  email: string | null
  photoURL: string | null
}

interface PendingInviteEntry {
  inviteId: string
  role: InviteRole
  expiresAt: string
}

interface CollaboratorsPanelProps {
  skyId: string
  currentUserId: string
}

const memberRoleLabels: Record<MemberRole, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Espectador',
}

const inviteRoleLabels: Record<InviteRole, string> = {
  editor: 'Editor',
  viewer: 'Espectador',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function CollaboratorsPanel({ skyId, currentUserId }: CollaboratorsPanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberEntry[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInviteEntry[]>([])
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)

  const loadPendingInvites = useCallback(async () => {
    try {
      const res = await fetch(`/api/skies/${skyId}/invites`)
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      if (data?.invites) setPendingInvites(data.invites)
    } catch {
      // non-critical: called after generate, main error handled by loadAll
    }
  }, [skyId])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`/api/skies/${skyId}/members`),
        fetch(`/api/skies/${skyId}/invites`),
      ])

      if (!membersRes.ok || !invitesRes.ok) {
        setError('No se pudo cargar el panel de colaboradores')
        return
      }

      const [membersData, invitesData] = await Promise.all([
        membersRes.json().catch(() => null),
        invitesRes.json().catch(() => null),
      ])

      if (membersData?.members) setMembers(membersData.members)
      if (invitesData?.invites) setPendingInvites(invitesData.invites)
    } catch {
      setError('Error de conexión al cargar el panel')
    } finally {
      setLoading(false)
    }
  }, [skyId])

  useEffect(() => {
    if (open) {
      loadAll()
    }
  }, [open, loadAll])

  async function handleGenerateInvite() {
    if (generating) return
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/skies/${skyId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'editor' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setGenerateError(data?.error || 'Error al generar la invitación')
        return
      }
      setInviteUrl(data.inviteUrl)
      await loadPendingInvites()
    } catch {
      setGenerateError('No se pudo conectar con el servidor')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyInvite() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // noop
    }
  }

  async function handleRevoke(inviteId: string) {
    if (revoking) return
    setRevoking(inviteId)
    setRevokeError(null)
    try {
      const res = await fetch(`/api/skies/${skyId}/invites/${inviteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setRevokeError(data?.error || 'Error al revocar la invitación')
        return
      }
      setPendingInvites(prev => prev.filter(i => i.inviteId !== inviteId))
    } catch {
      setRevokeError('No se pudo conectar con el servidor')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggleBtn}
        onClick={() => setOpen(prev => !prev)}
        type="button"
        aria-expanded={open}
      >
        Colaboradores {open ? '▾' : '▸'}
      </button>

      {open && (
        <div className={styles.panel}>
          {loading && <p className={styles.loadingText}>Cargando…</p>}
          {!loading && error && <p className={styles.errorMsg}>{error}</p>}

          {!loading && !error && (
            <>
              {/* Members */}
              <section className={styles.section}>
                <p className={styles.sectionLabel}>Miembros</p>
                {members.length === 0 ? (
                  <p className={styles.emptyText}>Sin miembros</p>
                ) : (
                  <ul className={styles.memberList}>
                    {members.map(m => (
                      <li key={m.userId} className={styles.memberRow}>
                        {m.photoURL && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.photoURL}
                            alt=""
                            className={styles.memberAvatar}
                          />
                        )}
                        <div className={styles.memberInfo}>
                          <span className={styles.memberName}>
                            {m.userId === currentUserId ? 'Tú' : m.displayName}
                          </span>
                          {m.userId !== currentUserId && m.email && m.displayName !== m.email && (
                            <span className={styles.memberEmail}>{m.email}</span>
                          )}
                          <span className={styles.memberEmail}>Se unió {formatDate(m.joinedAt)}</span>
                        </div>
                        <span className={styles.roleBadge}>{memberRoleLabels[m.role]}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Pending invites */}
              <section className={styles.section}>
                <p className={styles.sectionLabel}>Invitaciones pendientes</p>
                {revokeError && <p className={styles.errorMsg}>{revokeError}</p>}
                {pendingInvites.length === 0 ? (
                  <p className={styles.emptyText}>Sin invitaciones pendientes</p>
                ) : (
                  <ul className={styles.inviteList}>
                    {pendingInvites.map(invite => (
                      <li key={invite.inviteId} className={styles.inviteRow}>
                        <div className={styles.inviteInfo}>
                          <span className={styles.roleBadge}>{inviteRoleLabels[invite.role]}</span>
                          <span className={styles.inviteExpiry}>
                            Expira {formatDate(invite.expiresAt)}
                          </span>
                        </div>
                        <button
                          className={styles.revokeBtn}
                          onClick={() => handleRevoke(invite.inviteId)}
                          disabled={revoking === invite.inviteId}
                          type="button"
                        >
                          {revoking === invite.inviteId ? 'Revocando…' : 'Revocar'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* New invite link */}
              <section className={styles.section}>
                <p className={styles.sectionLabel}>Nuevo enlace de invitación</p>
                {generateError && <p className={styles.errorMsg}>{generateError}</p>}
                {inviteUrl ? (
                  <div className={styles.inviteUrlBlock}>
                    <p className={styles.inviteUrlText}>{inviteUrl}</p>
                    <div className={styles.inviteActions}>
                      <button
                        className={styles.copyBtn}
                        onClick={handleCopyInvite}
                        type="button"
                      >
                        {copied ? 'Copiado' : 'Copiar enlace'}
                      </button>
                      <button
                        className={styles.clearBtn}
                        onClick={() => { setInviteUrl(null); setGenerateError(null) }}
                        type="button"
                      >
                        Cerrar
                      </button>
                    </div>
                    <button
                      className={styles.generateBtn}
                      onClick={handleGenerateInvite}
                      disabled={generating}
                      type="button"
                    >
                      {generating ? 'Generando…' : 'Nuevo enlace'}
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.generateBtn}
                    onClick={handleGenerateInvite}
                    disabled={generating}
                    type="button"
                  >
                    {generating ? 'Generando…' : 'Generar enlace de invitación'}
                  </button>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  )
}
