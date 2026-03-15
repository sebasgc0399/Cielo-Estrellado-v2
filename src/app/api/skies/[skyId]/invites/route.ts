import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { adminDb } from '@/lib/firebase/admin'
import { createInvite } from '@/lib/invites/createInvite'
import { getSkyPendingInvites } from '@/lib/invites/getSkyPendingInvites'
import type { MemberRecord, InviteRole } from '@/domain/contracts'

async function requireOwner(skyId: string, uid: string): Promise<MemberRecord | null> {
  const memberDoc = await adminDb
    .collection('skies')
    .doc(skyId)
    .collection('members')
    .doc(uid)
    .get()
  if (!memberDoc.exists) return null
  const member = memberDoc.data() as MemberRecord
  if (member.status !== 'active' || member.role !== 'owner') return null
  return member
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ skyId: string }> },
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { skyId } = await params

    const member = await requireOwner(skyId, user.uid)
    if (!member) {
      return NextResponse.json(
        { error: 'Solo el propietario puede ver las invitaciones' },
        { status: 403 },
      )
    }

    const invites = await getSkyPendingInvites(skyId)
    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Invite list failed:', error)
    return NextResponse.json({ error: 'Error interno al listar invitaciones' }, { status: 500 })
  }
}

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

    const member = await requireOwner(skyId, user.uid)
    if (!member) {
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
