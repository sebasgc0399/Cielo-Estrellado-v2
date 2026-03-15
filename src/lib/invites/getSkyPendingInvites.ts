import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { InviteRecord, InviteRole, IsoDateString } from '@/domain/contracts'

export interface PendingInviteEntry {
  inviteId: string
  role: InviteRole
  expiresAt: IsoDateString
}

export async function getSkyPendingInvites(skyId: string): Promise<PendingInviteEntry[]> {
  const now = new Date()

  const snap = await adminDb
    .collection('invites')
    .where('skyId', '==', skyId)
    .where('status', '==', 'pending')
    .orderBy('expiresAt', 'asc')
    .get()

  if (snap.empty) return []

  return snap.docs
    .filter(doc => {
      const invite = doc.data() as InviteRecord
      return new Date(invite.expiresAt) > now
    })
    .map(doc => {
      const invite = doc.data() as InviteRecord
      return {
        inviteId: doc.id,
        role: invite.role,
        expiresAt: invite.expiresAt,
      }
    })
}
