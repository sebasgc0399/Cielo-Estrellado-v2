import { getSessionUser } from '@/lib/auth/getSessionUser'
import { adminDb } from '@/lib/firebase/admin'
import type { UserRecord } from '@/domain/contracts'
import SignOutButton from './SignOutButton'
import styles from './page.module.css'

export default async function PerfilPage() {
  const user = await getSessionUser()
  // layout.tsx ya redirige si no hay sesión; este null nunca se alcanza
  if (!user) return null

  let record: UserRecord | null = null
  try {
    const snap = await adminDb.collection('users').doc(user.uid).get()
    if (snap.exists) {
      record = snap.data() as UserRecord
    }
  } catch {
    // Error de Firestore: renderizamos con los datos de SessionUser únicamente
  }

  const notSynced = !record

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Yo</h1>

      {notSynced && (
        <p className={styles.syncWarning}>Perfil no sincronizado</p>
      )}

      <div className={styles.card}>
        {record?.photoURL && (
          <div className={styles.rowCenter}>
            <span className={styles.label}>Foto</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={record.photoURL}
              alt="Foto de perfil"
              className={styles.photoAvatar}
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className={styles.row}>
          <span className={styles.label}>Nombre</span>
          <span className={styles.value}>{record?.displayName ?? user.displayName ?? '—'}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Email</span>
          <span className={styles.value}>{record?.email ?? user.email}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Verificado</span>
          <span className={styles.value}>{user.emailVerified ? 'Sí' : 'No'}</span>
        </div>
        {record?.providers && record.providers.length > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>Acceso</span>
            <span className={styles.value}>{record.providers.join(', ')}</span>
          </div>
        )}
        {record?.lastLoginAt && (
          <div className={styles.row}>
            <span className={styles.label}>Último acceso</span>
            <span className={styles.value}>
              {new Date(record.lastLoginAt).toLocaleDateString('es', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
        {record?.createdAt && (
          <div className={styles.row}>
            <span className={styles.label}>Cuenta desde</span>
            <span className={styles.value}>
              {new Date(record.createdAt).toLocaleDateString('es', {
                year: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}
      </div>

      <SignOutButton />
    </div>
  )
}
