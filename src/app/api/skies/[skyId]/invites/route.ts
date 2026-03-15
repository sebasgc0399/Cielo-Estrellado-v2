import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { adminDb } from '@/lib/firebase/admin'
import { createInvite } from '@/lib/invites/createInvite'
import type { MemberRecord, InviteRole } from '@/domain/contracts'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ skyId: string }> },
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skyId } = await params

    const memberDoc = await adminDb
      .collection('skies')
      .doc(skyId)
      .collection('members')
      .doc(user.uid)
      .get()

    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'No tienes acceso a este cielo' }, { status: 403 })
    }

    const member = memberDoc.data() as MemberRecord
    if (member.status !== 'active' || member.role !== 'owner') {
      return NextResponse.json(
        { error: 'Solo el propietario puede crear invitaciones' },
        { status: 403 },
      )
    }

    const appUrl = process.env.APP_URL?.trim()
    if (!appUrl) {
      return NextResponse.json({ error: 'APP_URL no configurado' }, { status: 500 })
    }

    const body = (await request.json().catch(() => ({}))) as { role?: unknown }
    const role: InviteRole = body.role === 'viewer' ? 'viewer' : 'editor'

    const { token } = await createInvite(skyId, role, user.uid)
    const inviteUrl = `${appUrl}/invite/${token}`

    return NextResponse.json({ inviteUrl }, { status: 201 })
  } catch (error) {
    console.error('Invite creation failed:', error)
    return NextResponse.json({ error: 'Error interno al crear la invitación' }, { status: 500 })
  }
}
