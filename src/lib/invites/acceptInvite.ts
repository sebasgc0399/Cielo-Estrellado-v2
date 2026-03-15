import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { InviteRecord, MemberRecord } from '@/domain/contracts'

export class InviteError extends Error {
  constructor(
    public readonly code: string,
    public readonly skyId?: string,
  ) {
    super(code)
    this.name = 'InviteError'
  }
}

export async function acceptInvite(
  inviteId: string,
  userId: string,
): Promise<{ skyId: string }> {
  return adminDb.runTransaction(async (tx) => {
    const inviteRef = adminDb.collection('invites').doc(inviteId)
    const inviteDoc = await tx.get(inviteRef)

    if (!inviteDoc.exists) {
      throw new InviteError('invite_not_found')
    }

    const invite = inviteDoc.data() as InviteRecord

    if (invite.status === 'accepted') {
      if (invite.acceptedByUserId === userId) {
        // Same user, double-submit: idempotent
        return { skyId: invite.skyId }
      }
      throw new InviteError('invite_already_used')
    }

    if (invite.status === 'revoked') {
      throw new InviteError('invite_revoked')
    }

    if (invite.status === 'expired') {
      throw new InviteError('invite_expired')
    }

    // status === 'pending': verify time-based expiry
    if (new Date(invite.expiresAt) <= new Date()) {
      throw new InviteError('invite_expired')
    }

    const memberRef = adminDb
      .collection('skies')
      .doc(invite.skyId)
      .collection('members')
      .doc(userId)

    const memberDoc = await tx.get(memberRef)

    if (memberDoc.exists) {
      const member = memberDoc.data() as MemberRecord
      if (member.status === 'active') {
        // Already a member via another path — leave invite intact
        throw new InviteError('already_member', invite.skyId)
      }
      // Member exists but not active (revoked, pending)
      throw new InviteError('membership_conflict')
    }

    const now = new Date().toISOString()

    const memberData: MemberRecord = {
      userId,
      role: invite.role,
      status: 'active',
      invitedByUserId: invite.createdByUserId,
      joinedAt: now,
    }

    tx.set(memberRef, memberData)
    tx.update(inviteRef, {
      status: 'accepted',
      acceptedByUserId: userId,
      acceptedAt: now,
    })

    return { skyId: invite.skyId }
  })
}
