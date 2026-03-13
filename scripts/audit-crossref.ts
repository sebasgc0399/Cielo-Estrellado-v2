/**
 * Cross-reference legacy Firestore stars against Cloudinary inventory.
 *
 * Usage:
 *   1. Ensure `.env.local` or `.env` is configured.
 *   2. Run `npm run audit:firestore` and `npm run audit:cloudinary`.
 *   3. Run: `npm run audit:crossref`
 *
 * Output:
 *   - referenced: Cloudinary assets truly referenced by Firestore
 *   - orphaned_in_stars: assets in `stars/` not referenced by Firestore
 *   - non_migration_assets: Cloudinary assets outside the migration scope
 *   - importPlan: normalized star payload preview for the migration scripts
 */

import './load-env'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const COLLECTION_NAME = 'stars'
const OUTPUT_PATH = resolve(__dirname, 'migration-crossref-report.json')
const CLOUDINARY_REPORT_PATH = resolve(__dirname, 'cloudinary-report.json')
const SERVICE_ACCOUNT_PATH = resolve(
  process.cwd(),
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './scripts/serviceAccountKey.json',
)

type LegacyStar = {
  createdAt?: unknown
  createdBy?: string
  image?: string
  message?: string
  title?: string
  x?: number
  y?: number
  year?: number
}

type CloudinaryAsset = {
  public_id: string
  url: string
  format: string
  sizeMB: number
  width: number
  height: number
  created_at: string
}

type CloudinaryReport = {
  totalImages: number
  totalSizeMB: number
  images: CloudinaryAsset[]
}

type ReferencedAsset = CloudinaryAsset & {
  legacyDocIds: string[]
  migrationStatus: 'referenced'
}

type OrphanedAsset = CloudinaryAsset & {
  exclusionReason: 'excluded_pending_review'
}

type NonMigrationAsset = CloudinaryAsset & {
  exclusionReason: 'sample_asset' | 'root_asset' | 'outside_scope'
}

type ImportableStar = {
  legacyDocId: string
  legacyCreatorKey: string | null
  legacyUrl: string | null
  title: string | null
  message: string | null
  year: number | null
  createdAtSource: 'firestore_timestamp' | 'primitive' | 'missing'
  createdAtISO: string | null
  xOriginal: number | null
  yOriginal: number | null
  xNormalized: number | null
  yNormalized: number | null
  imageMigrationStatus: 'referenced' | 'no_image' | 'missing_in_cloudinary_report'
  recommendedStoragePath: string | null
}

type CrossrefReport = {
  summary: {
    totalLegacyStars: number
    creators: Record<string, number>
    importableStars: number
    starsWithoutImage: number
    starsWithReferencedImage: number
    starsWithMissingCloudinaryImage: number
    referencedAssets: number
    orphanedInStarsFolder: number
    nonMigrationAssets: number
  }
  migrationPolicy: {
    cloudinaryScope: 'only_firestorereferenced_assets'
    coordinateStrategy: 'normalize_percent_scale_to_unit_range'
    firestoreBackupRequirement: 'export_to_gcs_before_any_write'
    localSnapshotsRequired: string[]
    orphanedAssetPolicy: 'excluded_pending_review'
  }
  referenced: ReferencedAsset[]
  orphaned_in_stars: OrphanedAsset[]
  non_migration_assets: NonMigrationAsset[]
  importPlan: {
    skies: Array<{
      legacyCreatorKey: string
      starCount: number
    }>
    stars: ImportableStar[]
  }
}

function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

function ensureFile(path: string, message: string) {
  if (!existsSync(path)) {
    console.error(message)
    process.exit(1)
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000
}

function normalizePercent(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return round6(clamp(value / 100, 0, 1))
}

function extractCreatedAt(createdAt: unknown): { iso: string | null; source: ImportableStar['createdAtSource'] } {
  if (!createdAt) return { iso: null, source: 'missing' }

  if (typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
    const date = (createdAt as { toDate: () => Date }).toDate()
    return Number.isNaN(date.getTime())
      ? { iso: null, source: 'missing' }
      : { iso: date.toISOString(), source: 'firestore_timestamp' }
  }

  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    const date = new Date(createdAt)
    return Number.isNaN(date.getTime())
      ? { iso: null, source: 'missing' }
      : { iso: date.toISOString(), source: 'primitive' }
  }

  const seconds = (createdAt as { _seconds?: number })._seconds
  const nanos = (createdAt as { _nanoseconds?: number })._nanoseconds ?? 0
  if (typeof seconds === 'number') {
    const millis = seconds * 1000 + Math.floor(nanos / 1_000_000)
    const date = new Date(millis)
    return Number.isNaN(date.getTime())
      ? { iso: null, source: 'missing' }
      : { iso: date.toISOString(), source: 'firestore_timestamp' }
  }

  return { iso: null, source: 'missing' }
}

function recommendedStoragePath(star: { legacyDocId: string; legacyUrl: string | null }, assetByUrl: Map<string, CloudinaryAsset>) {
  if (!star.legacyUrl) return null
  const asset = assetByUrl.get(star.legacyUrl)
  if (!asset) return null
  return `legacy/stars/${star.legacyDocId}.${asset.format}`
}

async function initFirestore() {
  ensureFile(
    SERVICE_ACCOUNT_PATH,
    `❌ No se encontro el service account JSON.\n   Ruta esperada: ${SERVICE_ACCOUNT_PATH}`,
  )

  if (!getApps().length) {
    const serviceAccount = readJsonFile<object>(SERVICE_ACCOUNT_PATH)
    initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) })
  }

  return getFirestore()
}

async function main() {
  ensureFile(
    CLOUDINARY_REPORT_PATH,
    '❌ Falta scripts/cloudinary-report.json. Ejecuta primero: npm run audit:cloudinary',
  )

  const db = await initFirestore()
  const cloudinaryReport = readJsonFile<CloudinaryReport>(CLOUDINARY_REPORT_PATH)
  const cloudinaryByUrl = new Map(cloudinaryReport.images.map((asset) => [asset.url, asset]))

  const snapshot = await db.collection(COLLECTION_NAME).get()
  const legacyStars: ImportableStar[] = []
  const creators: Record<string, number> = {}
  const docIdsByUrl = new Map<string, string[]>()

  for (const doc of snapshot.docs) {
    const data = doc.data() as LegacyStar
    const legacyUrl = typeof data.image === 'string' && data.image.trim() ? data.image : null
    const legacyCreatorKey = typeof data.createdBy === 'string' ? data.createdBy : null
    const createdAt = extractCreatedAt(data.createdAt)

    if (legacyCreatorKey) {
      creators[legacyCreatorKey] = (creators[legacyCreatorKey] || 0) + 1
    }

    if (legacyUrl) {
      const ids = docIdsByUrl.get(legacyUrl) ?? []
      ids.push(doc.id)
      docIdsByUrl.set(legacyUrl, ids)
    }

    const imageMigrationStatus: ImportableStar['imageMigrationStatus'] = !legacyUrl
      ? 'no_image'
      : cloudinaryByUrl.has(legacyUrl)
        ? 'referenced'
        : 'missing_in_cloudinary_report'

    legacyStars.push({
      legacyDocId: doc.id,
      legacyCreatorKey,
      legacyUrl,
      title: typeof data.title === 'string' ? data.title : null,
      message: typeof data.message === 'string' ? data.message : null,
      year: typeof data.year === 'number' ? data.year : null,
      createdAtSource: createdAt.source,
      createdAtISO: createdAt.iso,
      xOriginal: typeof data.x === 'number' ? data.x : null,
      yOriginal: typeof data.y === 'number' ? data.y : null,
      xNormalized: normalizePercent(data.x),
      yNormalized: normalizePercent(data.y),
      imageMigrationStatus,
      recommendedStoragePath: recommendedStoragePath({ legacyDocId: doc.id, legacyUrl }, cloudinaryByUrl),
    })
  }

  const referenced = cloudinaryReport.images
    .filter((asset) => docIdsByUrl.has(asset.url))
    .map<ReferencedAsset>((asset) => ({
      ...asset,
      legacyDocIds: docIdsByUrl.get(asset.url) ?? [],
      migrationStatus: 'referenced',
    }))

  const orphanedInStars = cloudinaryReport.images
    .filter((asset) => asset.public_id.startsWith('stars/') && !docIdsByUrl.has(asset.url))
    .map<OrphanedAsset>((asset) => ({
      ...asset,
      exclusionReason: 'excluded_pending_review',
    }))

  const nonMigrationAssets = cloudinaryReport.images
    .filter((asset) => !asset.public_id.startsWith('stars/'))
    .map<NonMigrationAsset>((asset) => ({
      ...asset,
      exclusionReason: asset.public_id.startsWith('samples/')
        ? 'sample_asset'
        : asset.public_id.includes('/')
          ? 'outside_scope'
          : 'root_asset',
    }))

  const skies = Object.entries(creators)
    .sort((a, b) => b[1] - a[1])
    .map(([legacyCreatorKey, starCount]) => ({ legacyCreatorKey, starCount }))

  const report: CrossrefReport = {
    summary: {
      totalLegacyStars: snapshot.size,
      creators,
      importableStars: legacyStars.length,
      starsWithoutImage: legacyStars.filter((star) => star.imageMigrationStatus === 'no_image').length,
      starsWithReferencedImage: legacyStars.filter((star) => star.imageMigrationStatus === 'referenced').length,
      starsWithMissingCloudinaryImage: legacyStars.filter((star) => star.imageMigrationStatus === 'missing_in_cloudinary_report').length,
      referencedAssets: referenced.length,
      orphanedInStarsFolder: orphanedInStars.length,
      nonMigrationAssets: nonMigrationAssets.length,
    },
    migrationPolicy: {
      cloudinaryScope: 'only_firestorereferenced_assets',
      coordinateStrategy: 'normalize_percent_scale_to_unit_range',
      firestoreBackupRequirement: 'export_to_gcs_before_any_write',
      localSnapshotsRequired: ['scripts/audit-report.json', 'scripts/cloudinary-report.json', 'scripts/migration-crossref-report.json'],
      orphanedAssetPolicy: 'excluded_pending_review',
    },
    referenced,
    orphaned_in_stars: orphanedInStars,
    non_migration_assets: nonMigrationAssets,
    importPlan: {
      skies,
      stars: legacyStars,
    },
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8')

  console.log('=== CROSSREF LEGACY ===\n')
  console.log(`Stars legacy: ${report.summary.totalLegacyStars}`)
  console.log(`Creadores detectados: ${Object.keys(report.summary.creators).length}`)
  console.log(`Assets referenciados para migracion: ${report.summary.referencedAssets}`)
  console.log(`Assets huerfanos en stars/: ${report.summary.orphanedInStarsFolder}`)
  console.log(`Assets fuera de alcance: ${report.summary.nonMigrationAssets}`)
  console.log(`Estrellas sin imagen: ${report.summary.starsWithoutImage}`)
  console.log(`Estrellas con imagen valida: ${report.summary.starsWithReferencedImage}`)
  console.log(`Estrellas con imagen faltante en Cloudinary: ${report.summary.starsWithMissingCloudinaryImage}`)

  if (report.orphaned_in_stars.length) {
    console.log('\nHuerfanos en stars/:')
    for (const asset of report.orphaned_in_stars) {
      console.log(`  - ${asset.public_id}`)
    }
  }

  console.log(`\n✅ Reporte guardado en: ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error('Error durante el cruce legacy:', error instanceof Error ? error.message : error)
  process.exit(1)
})
