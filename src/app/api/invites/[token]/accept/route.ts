import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { findInviteIdByToken } from '@/lib/invites/findInviteIdByToken'
import { acceptInvite, InviteError } from '@/lib/invites/acceptInvite'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await params

    const inviteId = await findInviteIdByToken(token)
    if (!inviteId) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    const { skyId } = await acceptInvite(inviteId, user.uid)
    return NextResponse.json({ skyId }, { status: 200 })
  } catch (error) {
    if (error instanceof InviteError) {
      switch (error.code) {
        case 'invite_not_found':
          return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
        case 'invite_expired':
          return NextResponse.json({ error: 'Esta invitación ha expirado' }, { status: 409 })
        case 'invite_revoked':
          return NextResponse.json({ error: 'Esta invitación fue revocada' }, { status: 409 })
        case 'invite_already_used':
          return NextResponse.json(
            { error: 'Esta invitación ya fue utilizada por otra persona' },
            { status: 409 },
          )
        case 'already_member':
          return NextResponse.json(
            { error: 'already_member', skyId: error.skyId },
            { status: 409 },
          )
        case 'membership_conflict':
          return NextResponse.json(
            { error: 'No se puede completar la invitación. Contacta al propietario.' },
            { status: 409 },
          )
      }
    }
    console.error('Accept invite failed:', error)
    return NextResponse.json({ error: 'Error interno al aceptar la invitación' }, { status: 500 })
  }
}
