import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { adminDb } from '@/lib/firebase/admin'
import type { SkyRecord, MemberRecord } from '@/domain/contracts'
import { DEFAULT_SKY_PERSONALIZATION } from '@/domain/contracts'

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { title?: unknown }
    const rawTitle = typeof body.title === 'string' ? body.title.trim() : ''

    if (!rawTitle) {
      return NextResponse.json(
        { error: 'El título es obligatorio' },
        { status: 400 },
      )
    }

    if (rawTitle.length > 100) {
      return NextResponse.json(
        { error: 'El título no puede superar 100 caracteres' },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const skyRef = adminDb.collection('skies').doc()

    const skyData: SkyRecord = {
      title: rawTitle,
      description: null,
      ownerUserId: user.uid,
      privacy: 'private',
      coverImagePath: null,
      source: 'native',
      importBatch: null,
      legacyCreatorKeys: [],
      personalization: DEFAULT_SKY_PERSONALIZATION,
      createdAt: now,
      updatedAt: now,
    }

    const memberData: MemberRecord = {
      userId: user.uid,
      role: 'owner',
      status: 'active',
      invitedByUserId: null,
      joinedAt: now,
    }

    const batch = adminDb.batch()
    batch.set(skyRef, skyData)
    batch.set(skyRef.collection('members').doc(user.uid), memberData)
    await batch.commit()

    return NextResponse.json({ skyId: skyRef.id }, { status: 201 })
  } catch (error) {
    console.error('Sky creation failed:', error)
    return NextResponse.json(
      { error: 'Error interno al crear el cielo' },
      { status: 500 },
    )
  }
}
