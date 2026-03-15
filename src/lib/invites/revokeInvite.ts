import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { InviteRecord } from '@/domain/contracts'

export class RevokeError extends Error {
  constructor(public readonly code: string) {
    super(code)
    this.name = 'RevokeError'
  }
}

export async function revokeInvite(inviteId: string, skyId: string): Promise<void> {
  await adminDb.runTransaction(async (tx) => {
    const inviteRef = adminDb.collection('invites').doc(inviteId)
    const inviteDoc = await tx.get(inviteRef)

    if (!inviteDoc.exists) {
      throw new RevokeError('invite_not_found')
    }

    const invite = inviteDoc.data() as InviteRecord

    // Don't reveal existence of invites belonging to other skies
    if (invite.skyId !== skyId) {
      throw new RevokeError('invite_not_found')
    }

    if (invite.status === 'accepted') {
      throw new RevokeError('invite_already_used')
    }

    if (invite.status === 'revoked') {
      throw new RevokeError('invite_already_revoked')
    }

    if (invite.status === 'expired') {
      throw new RevokeError('invite_expired')
    }

    // status === 'pending': validate time-based expiry
    // Treat as expired even if Firestore still shows status='pending'
    if (new Date(invite.expiresAt) <= new Date()) {
      throw new RevokeError('invite_expired')
    }

    tx.update(inviteRef, { status: 'revoked' })
  })
}
