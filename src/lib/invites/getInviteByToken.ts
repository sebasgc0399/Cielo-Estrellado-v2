import 'server-only'

import { createHash } from 'node:crypto'
import { adminDb } from '@/lib/firebase/admin'
import type { InviteRecord, InviteRole, SkyRecord } from '@/domain/contracts'

export type InvitePreviewResult =
  | {
      valid: true
      inviteId: string
      skyId: string
      skyTitle: string
      role: InviteRole
    }
  | {
      valid: false
      reason: 'not_found' | 'expired' | 'revoked' | 'accepted'
    }

export async function getInviteByToken(token: string): Promise<InvitePreviewResult> {
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const snapshot = await adminDb
    .collection('invites')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return { valid: false, reason: 'not_found' }
  }

  const doc = snapshot.docs[0]
  const invite = doc.data() as InviteRecord

  if (invite.status === 'revoked') {
    return { valid: false, reason: 'revoked' }
  }

  if (invite.status === 'accepted') {
    return { valid: false, reason: 'accepted' }
  }

  if (invite.status === 'expired' || new Date(invite.expiresAt) <= new Date()) {
    return { valid: false, reason: 'expired' }
  }

  const skyDoc = await adminDb.collection('skies').doc(invite.skyId).get()
  const sky = skyDoc.exists ? (skyDoc.data() as SkyRecord) : null

  return {
    valid: true,
    inviteId: doc.id,
    skyId: invite.skyId,
    skyTitle: sky?.title ?? 'Cielo sin nombre',
    role: invite.role,
  }
}
