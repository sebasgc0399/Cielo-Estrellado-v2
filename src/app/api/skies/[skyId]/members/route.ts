import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { adminDb } from '@/lib/firebase/admin'
import { getSkyMembers } from '@/lib/members/getSkyMembers'
import type { MemberRecord } from '@/domain/contracts'

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
        { error: 'Solo el propietario puede ver la lista de miembros' },
        { status: 403 },
      )
    }

    const members = await getSkyMembers(skyId)
    return NextResponse.json({ members })
  } catch (error) {
    console.error('Members list failed:', error)
    return NextResponse.json({ error: 'Error interno al listar miembros' }, { status: 500 })
  }
}
