import { getSessionUser } from '@/lib/auth/getSessionUser'
import { getUserSkies } from '@/lib/skies/getUserSkies'
import { AppContent } from './AppContent'

export default async function AppPage() {
  const user = await getSessionUser()
  // layout.tsx ya redirige si no hay sesión; este null nunca se alcanza
  if (!user) return null

  const result = await getUserSkies(user.uid)

  return <AppContent user={user} skiesResult={result} />
}
