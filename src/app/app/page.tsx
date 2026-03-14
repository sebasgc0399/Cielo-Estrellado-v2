import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { AppContent } from './AppContent'

export default async function AppPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return <AppContent user={user} />
}
