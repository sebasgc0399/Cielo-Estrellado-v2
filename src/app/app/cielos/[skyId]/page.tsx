import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { getSkyWithAccess } from '@/lib/skies/getSkyWithAccess'
import { getSkyStars } from '@/lib/skies/getSkyStars'
import { SkyDetailContent } from './SkyDetailContent'

interface Props {
  params: Promise<{ skyId: string }>
}

export default async function SkyDetailPage({ params }: Props) {
  const { skyId } = await params

  const user = await getSessionUser()
  if (!user) redirect('/login')

  const result = await getSkyWithAccess(skyId, user.uid)

  if (result.ok === false && result.reason === 'error') {
    throw new Error(result.error ?? 'Error al cargar el cielo')
  }

  if (!result.ok) notFound()

  const { sky, member } = result

  const starsResult = await getSkyStars(skyId)

  const canCreate = member.role === 'owner' || member.role === 'editor'

  return (
    <SkyDetailContent
      skyId={skyId}
      sky={sky}
      member={member}
      userId={user.uid}
      stars={starsResult.ok ? starsResult.stars : []}
      starsError={starsResult.ok ? null : starsResult.error}
      canCreate={canCreate}
    />
  )
}
