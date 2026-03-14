import { headers } from 'next/headers'
import type { SessionUser } from './types'

export async function getSessionUser(): Promise<SessionUser | null> {
  const headerStore = await headers()
  const raw = headerStore.get('x-session-user')
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}
