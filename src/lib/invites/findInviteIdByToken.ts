import 'server-only'

import { createHash } from 'node:crypto'
import { adminDb } from '@/lib/firebase/admin'

// Routing-only lookup: returns the inviteId for a raw token without
// validating status or expiry. The atomic transaction in acceptInvite
// is the authoritative validator.
export async function findInviteIdByToken(token: string): Promise<string | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const snapshot = await adminDb
    .collection('invites')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  return snapshot.docs[0].id
}
