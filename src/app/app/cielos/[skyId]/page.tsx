import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { getSkyWithAccess } from '@/lib/skies/getSkyWithAccess'
import type { MemberRole, SkySource } from '@/domain/contracts'
import styles from './page.module.css'

const roleLabels: Record<MemberRole, string> = {
  owner: 'Propietario',
  editor: 'Editor',
  viewer: 'Espectador',
  legacy_claimant: 'Legacy',
}

const sourceLabels: Record<SkySource, string> = {
  native: 'Nativo',
  legacy_import: 'Importado',
}

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

  return (
    <div className={styles.page}>
      <Link href="/app" className={styles.backLink}>
        ← Mis cielos
      </Link>

      <section className={styles.header}>
        <h1 className={styles.title}>{sky.title}</h1>
        <div className={styles.badges}>
          <span className={styles.badge}>{roleLabels[member.role]}</span>
          <span className={styles.badge}>Privado</span>
          <span className={styles.badge}>{sourceLabels[sky.source]}</span>
        </div>
        <p className={styles.meta}>
          Creado el{' '}
          {new Date(sky.createdAt).toLocaleDateString('es', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </section>

      <section className={styles.starsPlaceholder}>
        <span className={styles.starsIcon} aria-hidden="true">✦</span>
        <p className={styles.starsText}>Las estrellas de este cielo aparecerán aquí</p>
      </section>
    </div>
  )
}
