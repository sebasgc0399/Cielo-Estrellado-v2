import { getSessionUser } from '@/lib/auth/getSessionUser'
import { AppContent } from './AppContent'

export default async function AppPage() {
  const user = await getSessionUser()
  // layout.tsx ya redirige si no hay sesión; este null nunca se alcanza
  if (!user) return null
  return <AppContent user={user} />
}
