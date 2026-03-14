import { getSessionUser } from '@/lib/auth/getSessionUser'
import styles from './page.module.css'

export default async function LegacyPage() {
  const user = await getSessionUser()
  // layout.tsx ya redirige si no hay sesión; este null nunca se alcanza
  if (!user) return null

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cielo heredado</h1>
      <p className={styles.description}>
        Si participaste en el sistema anterior, puedes solicitar revisión de tu cielo legacy.
      </p>

      {!user.emailVerified ? (
        <div className={styles.stateBlock}>
          <p className={styles.stateText}>
            Necesitas verificar tu email antes de continuar.
          </p>
          <button className={styles.actionBtn} disabled type="button">
            Reenviar verificación
          </button>
        </div>
      ) : (
        <div className={styles.stateBlock}>
          <button className={styles.actionBtn} disabled type="button">
            Iniciar solicitud de revisión
          </button>
          <p className={styles.actionNote}>Este flujo estará disponible próximamente.</p>
        </div>
      )}
    </div>
  )
}
