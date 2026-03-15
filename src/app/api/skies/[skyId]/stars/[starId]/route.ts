import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { getSkyWithAccess } from '@/lib/skies/getSkyWithAccess'
import { adminDb } from '@/lib/firebase/admin'
import type { StarRecord } from '@/domain/contracts'

interface RouteContext {
  params: Promise<{ skyId: string; starId: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skyId, starId } = await params

    const access = await getSkyWithAccess(skyId, user.uid)

    if (!access.ok) {
      if (access.reason === 'error') {
        return NextResponse.json(
          { error: 'Error interno al verificar acceso' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: 'Cielo no encontrado' }, { status: 404 })
    }

    const starRef = adminDb
      .collection('skies')
      .doc(skyId)
      .collection('stars')
      .doc(starId)

    const starSnap = await starRef.get()
    if (!starSnap.exists) {
      return NextResponse.json({ error: 'Estrella no encontrada' }, { status: 404 })
    }

    const star = starSnap.data() as StarRecord
    if (star.deletedAt !== null) {
      return NextResponse.json({ error: 'Estrella no encontrada' }, { status: 404 })
    }

    const { role } = access.member
    const canEdit =
      role === 'owner' || (role === 'editor' && star.authorUserId === user.uid)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta estrella' },
        { status: 403 },
      )
    }

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

    const newMessage = rawMessage || null
    if (rawTitle === star.title && newMessage === star.message) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const now = new Date().toISOString()
    await starRef.update({
      title: rawTitle,
      message: newMessage,
      updatedAt: now,
      updatedByUserId: user.uid,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Star update failed:', error)
    return NextResponse.json(
      { error: 'Error interno al actualizar la estrella' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skyId, starId } = await params

    const access = await getSkyWithAccess(skyId, user.uid)

    if (!access.ok) {
      if (access.reason === 'error') {
        return NextResponse.json(
          { error: 'Error interno al verificar acceso' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: 'Cielo no encontrado' }, { status: 404 })
    }

    const starRef = adminDb
      .collection('skies')
      .doc(skyId)
      .collection('stars')
      .doc(starId)

    const starSnap = await starRef.get()
    if (!starSnap.exists) {
      return NextResponse.json({ error: 'Estrella no encontrada' }, { status: 404 })
    }

    const star = starSnap.data() as StarRecord
    if (star.deletedAt !== null) {
      return NextResponse.json({ error: 'Estrella no encontrada' }, { status: 404 })
    }

    const { role } = access.member
    const canDelete =
      role === 'owner' || (role === 'editor' && star.authorUserId === user.uid)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta estrella' },
        { status: 403 },
      )
    }

    const now = new Date().toISOString()
    await starRef.update({
      deletedAt: now,
      deletedByUserId: user.uid,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Star delete failed:', error)
    return NextResponse.json(
      { error: 'Error interno al eliminar la estrella' },
      { status: 500 },
    )
  }
}
