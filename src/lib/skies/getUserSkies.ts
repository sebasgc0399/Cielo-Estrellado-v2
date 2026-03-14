import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { SkyRecord, MemberRecord, MemberRole } from '@/domain/contracts'

export type UserSkyEntry = {
  skyId: string
  sky: SkyRecord
  role: MemberRole
}

export type GetUserSkiesResult =
  | { ok: true; skies: UserSkyEntry[] }
  | { ok: false; error: string }

export async function getUserSkies(uid: string): Promise<GetUserSkiesResult> {
  try {
    const membersSnap = await adminDb
      .collectionGroup('members')
      .where('userId', '==', uid)
      .where('status', '==', 'active')
      .get()

    if (membersSnap.empty) {
      return { ok: true, skies: [] }
    }

    const entries: { skyId: string; role: MemberRole }[] = []
    const skyRefs: FirebaseFirestore.DocumentReference[] = []

    for (const doc of membersSnap.docs) {
      const member = doc.data() as MemberRecord
      const skyRef = doc.ref.parent.parent
      if (!skyRef) continue
      entries.push({ skyId: skyRef.id, role: member.role })
      skyRefs.push(skyRef)
    }

    if (skyRefs.length === 0) {
      return { ok: true, skies: [] }
    }

    const skySnaps = await adminDb.getAll(...skyRefs)

    const skies: UserSkyEntry[] = []
    for (let i = 0; i < skySnaps.length; i++) {
      const snap = skySnaps[i]
      if (!snap.exists) continue
      skies.push({
        skyId: entries[i].skyId,
        sky: snap.data() as SkyRecord,
        role: entries[i].role,
      })
    }

    skies.sort((a, b) => b.sky.createdAt.localeCompare(a.sky.createdAt))

    return { ok: true, skies }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido al cargar cielos'
    console.error('getUserSkies failed:', err)
    return { ok: false, error: message }
  }
}
