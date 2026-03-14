import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import NavItems from './NavItems'
import styles from './layout.module.css'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const initial = ((user.displayName ?? user.email) || '?')[0].toUpperCase()

  return (
    <div className={styles.shell}>
      <div className={styles.bg} aria-hidden="true" />

      <header className={styles.topbar}>
        <Link href="/app" className={styles.brand}>
          <span className={styles.brandStar} aria-hidden="true">✦</span>
          <span className={styles.brandName}>Cielo Estrellado</span>
        </Link>

        <NavItems listClassName={styles.desktopNavList} />

        <Link href="/app/perfil" className={styles.avatar} aria-label="Ir a perfil">
          {initial}
        </Link>
      </header>

      <main className={styles.main}>{children}</main>

      <nav className={styles.bottomNav} aria-label="Navegación principal">
        <NavItems listClassName={styles.bottomNavList} />
      </nav>
    </div>
  )
}
