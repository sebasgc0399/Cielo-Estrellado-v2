import 'server-only'

import { adminDb } from '@/lib/firebase/admin'
import type { StarRecord } from '@/domain/contracts'

export type StarEntry = { starId: string; star: StarRecord }

export type GetSkyStarsResult =
  | { ok: true; stars: StarEntry[] }
  | { ok: false; error: string }

export async function getSkyStars(skyId: string): Promise<GetSkyStarsResult> {
  try {
    const snapshot = await adminDb
      .collection('skies')
      .doc(skyId)
      .collection('stars')
      .orderBy('createdAt', 'desc')
      .get()

    const stars: StarEntry[] = []
    for (const doc of snapshot.docs) {
      const star = doc.data() as StarRecord
      if (star.deletedAt === null) {
        stars.push({ starId: doc.id, star })
      }
    }

    return { ok: true, stars }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error desconocido al cargar estrellas'
    console.error('getSkyStars failed:', err)
    return { ok: false, error: message }
  }
}
