import { NextResponse } from 'next/server'
import { getInviteByToken } from '@/lib/invites/getInviteByToken'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const result = await getInviteByToken(token)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Invite preview failed:', error)
    return NextResponse.json({ valid: false, reason: 'not_found' })
  }
}
