import Link from 'next/link'
import type { SessionUser } from '@/lib/auth/types'
import styles from './page.module.css'

interface AppContentProps {
  user: SessionUser
}

export function AppContent({ user }: AppContentProps) {
  const greeting = user.displayName ? `Hola, ${user.displayName}` : 'Hola'

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.greeting}>{greeting}</h1>
      </section>

      {!user.emailVerified && (
        <div className={styles.emailBanner} role="alert">
          Verifica tu email para reclamar un cielo o aceptar invitaciones.
        </div>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionLabel}>Tus cielos</h2>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">✦</span>
          <p className={styles.emptyTitle}>Aún no tienes un cielo</p>
          <p className={styles.emptyText}>
            Un cielo es tu espacio personal de recuerdos y estrellas.
          </p>
          <button className={styles.ctaBtn} disabled type="button">
            Crear mi primer cielo
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.legacyCard}>
          <span className={styles.legacyCardLabel}>Cielo heredado</span>
          <p className={styles.legacyCardText}>
            Si participaste en el sistema anterior, puedes solicitar revisión de tu cielo legacy.
          </p>
          <Link href="/app/legacy" className={styles.legacyCardBtn}>
            Solicitar revisión
          </Link>
        </div>
      </section>
    </div>
  )
}
