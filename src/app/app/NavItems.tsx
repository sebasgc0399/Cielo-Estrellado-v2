'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './layout.module.css'

const NAV_ITEMS = [
  { href: '/app', label: 'Mi cielo' },
  { href: '/app/legacy', label: 'Cielo heredado' },
  { href: '/app/perfil', label: 'Yo' },
] as const

type NavItemsProps = {
  listClassName: string
}

export default function NavItems({ listClassName }: NavItemsProps) {
  const pathname = usePathname()

  return (
    <ul className={listClassName}>
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = href === '/app' ? pathname === '/app' : pathname.startsWith(href)
        return (
          <li key={href}>
            <Link
              href={href}
              className={isActive ? styles.navLinkActive : styles.navLink}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{label}</span>
              {isActive && <span className={styles.navDot} aria-hidden="true" />}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
