import { getInviteByToken } from '@/lib/invites/getInviteByToken'
import { InviteAcceptContent } from './InviteAcceptContent'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const preview = await getInviteByToken(token)

  return <InviteAcceptContent token={token} preview={preview} />
}
