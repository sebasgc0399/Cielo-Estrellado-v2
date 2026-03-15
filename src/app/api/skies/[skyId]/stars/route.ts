import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { getSkyWithAccess } from '@/lib/skies/getSkyWithAccess'
import { adminDb } from '@/lib/firebase/admin'
import type { StarRecord } from '@/domain/contracts'

interface RouteContext {
  params: Promise<{ skyId: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skyId } = await params

    const body = (await request.json()) as { title?: unknown; message?: unknown }

    const rawTitle = typeof body.title === 'string' ? body.title.trim() : ''
    if (!rawTitle) {
      return NextResponse.json(
        { error: 'El título es obligatorio' },
        { status: 400 },
      )
    }
    if (rawTitle.length > 200) {
      return NextResponse.json(
        { error: 'El título no puede superar 200 caracteres' },
        { status: 400 },
      )
    }

    const rawMessage = typeof body.message === 'string' ? body.message.trim() : ''
    if (rawMessage.length > 2000) {
      return NextResponse.json(
        { error: 'El mensaje no puede superar 2000 caracteres' },
        { status: 400 },
      )
    }

    const access = await getSkyWithAccess(skyId, user.uid)

    if (!access.ok) {
      if (access.reason === 'error') {
        return NextResponse.json(
          { error: 'Error interno al verificar acceso' },
          { status: 500 },
        )
      }
      return NextResponse.json(
        { error: 'Cielo no encontrado' },
        { status: 404 },
      )
    }

    if (access.member.role !== 'owner' && access.member.role !== 'editor') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear estrellas en este cielo' },
        { status: 403 },
      )
    }

    const now = new Date().toISOString()
    const starRef = adminDb
      .collection('skies')
      .doc(skyId)
      .collection('stars')
      .doc()

    const starData: StarRecord = {
      title: rawTitle,
      message: rawMessage || null,
      imagePath: null,
      legacyUrl: null,
      xNormalized: null,
      yNormalized: null,
      year: null,
      authorUserId: user.uid,
      updatedByUserId: user.uid,
      legacyCreatorKey: null,
      legacyDocId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedByUserId: null,
    }

    await starRef.set(starData)

    return NextResponse.json({ starId: starRef.id }, { status: 201 })
  } catch (error) {
    console.error('Star creation failed:', error)
    return NextResponse.json(
      { error: 'Error interno al crear la estrella' },
      { status: 500 },
    )
  }
}
