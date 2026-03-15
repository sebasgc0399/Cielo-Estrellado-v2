import 'server-only'

import { createHash, randomBytes } from 'node:crypto'
import { adminDb } from '@/lib/firebase/admin'
import type { InviteRecord, InviteRole } from '@/domain/contracts'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function createInvite(
  skyId: string,
  role: InviteRole,
  createdByUserId: string,
): Promise<{ token: string; inviteId: string }> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const now = new Date()
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS)

  const inviteData: InviteRecord = {
    skyId,
    role,
    tokenHash,
    createdByUserId,
    expiresAt: expiresAt.toISOString(),
    status: 'pending',
    acceptedByUserId: null,
    acceptedAt: null,
  }

  const docRef = adminDb.collection('invites').doc()
  await docRef.set(inviteData)

  return { token, inviteId: docRef.id }
}
