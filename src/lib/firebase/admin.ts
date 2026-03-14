import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function initAdmin() {
  if (getApps().length) return getApp()

  const serviceAccountPath = resolve(
    process.cwd(),
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './scripts/serviceAccountKey.json',
  )

  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

  return initializeApp({
    credential: cert(serviceAccount),
  })
}

const app = initAdmin()

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
