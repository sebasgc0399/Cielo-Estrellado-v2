import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { SkyRecord, MemberRecord } from '@/domain/contracts'

export type SkyAccessResult =
  | { ok: true; sky: SkyRecord; member: MemberRecord }
  | { ok: false; reason: 'not_found' | 'no_access' | 'error'; error?: string }

export async function getSkyWithAccess(
  skyId: string,
  uid: string,
): Promise<SkyAccessResult> {
  try {
    const skyRef = adminDb.collection('skies').doc(skyId)
    const memberRef = skyRef.collection('members').doc(uid)

    const [skySnap, memberSnap] = await adminDb.getAll(skyRef, memberRef)

    if (!skySnap.exists) {
      return { ok: false, reason: 'not_found' }
    }

    if (!memberSnap.exists) {
      return { ok: false, reason: 'no_access' }
    }

    const member = memberSnap.data() as MemberRecord
    if (member.status !== 'active') {
      return { ok: false, reason: 'no_access' }
    }

    return {
      ok: true,
      sky: skySnap.data() as SkyRecord,
      member,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al cargar el cielo'
    console.error('getSkyWithAccess failed:', err)
    return { ok: false, reason: 'error', error: message }
  }
}
