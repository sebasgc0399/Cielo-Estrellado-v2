import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { adminDb } from '@/lib/firebase/admin'
import { revokeInvite, RevokeError } from '@/lib/invites/revokeInvite'
import type { MemberRecord } from '@/domain/contracts'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ skyId: string; inviteId: string }> },
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skyId, inviteId } = await params

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
        { error: 'Solo el propietario puede revocar invitaciones' },
        { status: 403 },
      )
    }

    await revokeInvite(inviteId, skyId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof RevokeError) {
      if (error.code === 'invite_not_found') {
        return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
      }
      if (error.code === 'invite_already_used') {
        return NextResponse.json({ error: 'Esta invitación ya fue utilizada' }, { status: 409 })
      }
      if (error.code === 'invite_already_revoked') {
        return NextResponse.json({ error: 'Esta invitación ya fue revocada' }, { status: 409 })
      }
      if (error.code === 'invite_expired') {
        return NextResponse.json({ error: 'Esta invitación ya expiró' }, { status: 409 })
      }
    }
    console.error('Revoke invite failed:', error)
    return NextResponse.json({ error: 'Error interno al revocar la invitación' }, { status: 500 })
  }
}
