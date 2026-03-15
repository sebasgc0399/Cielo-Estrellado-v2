import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { MemberRecord, MemberRole, UserRecord, IsoDateString } from '@/domain/contracts'

export interface MemberDisplayEntry {
  userId: string
  role: MemberRole
  joinedAt: IsoDateString
  displayName: string
  email: string | null
  photoURL: string | null
}

export async function getSkyMembers(skyId: string): Promise<MemberDisplayEntry[]> {
  const membersSnap = await adminDb
    .collection('skies')
    .doc(skyId)
    .collection('members')
    .where('status', '==', 'active')
    .get()

  if (membersSnap.empty) return []

  const memberDocs = membersSnap.docs
  const userRefs = memberDocs.map(doc => adminDb.collection('users').doc(doc.id))
  const userDocs = await adminDb.getAll(...userRefs)

  return memberDocs.map((memberDoc, index) => {
    const member = memberDoc.data() as MemberRecord
    const userDoc = userDocs[index]
    const user = userDoc.exists ? (userDoc.data() as UserRecord) : null

    return {
      userId: memberDoc.id,
      role: member.role,
      joinedAt: member.joinedAt,
      displayName: user?.displayName ?? user?.email ?? `uid_${memberDoc.id.slice(0, 6)}`,
      email: user?.email ?? null,
      photoURL: user?.photoURL ?? null,
    }
  })
}
