import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const CROSSREF_REPORT_PATH = resolve(__dirname, 'migration-crossref-report.json')
export const IMAGES_REPORT_PATH = resolve(__dirname, 'migration-images-report.json')
export const STARS_REPORT_PATH = resolve(__dirname, 'migration-stars-report.json')
export const VALIDATION_REPORT_PATH = resolve(__dirname, 'migration-validation-report.json')

export type CrossrefImportStar = {
  legacyDocId: string
  legacyCreatorKey: string | null
  legacyUrl: string | null
  title: string | null
  message: string | null
  year: number | null
  createdAtISO: string | null
  xNormalized: number | null
  yNormalized: number | null
  imageMigrationStatus: 'referenced' | 'no_image' | 'missing_in_cloudinary_report'
  recommendedStoragePath: string | null
}

export type CrossrefReferencedAsset = {
  public_id: string
  url: string
  format: string
  legacyDocIds: string[]
}

export type CrossrefReport = {
  summary: {
    totalLegacyStars: number
    importableStars: number
    starsWithoutImage: number
    starsWithReferencedImage: number
    starsWithMissingCloudinaryImage: number
    referencedAssets: number
    orphanedInStarsFolder: number
    nonMigrationAssets: number
    creators: Record<string, number>
  }
  referenced: CrossrefReferencedAsset[]
  orphaned_in_stars: Array<{
    public_id: string
    url: string
    format: string
  }>
  importPlan: {
    sky: {
      skyId: string
      title: string
      source: 'legacy_import'
      importBatch: string
      claimStatus: 'unclaimed'
      ownerUserId: null
      claimedByUserIds: string[]
      legacyCreatorKeys: string[]
      personalization: {
        theme: 'classic' | 'romantic' | 'deep-night'
        density: 'low' | 'medium' | 'high'
        nebulaEnabled: boolean
        twinkleEnabled: boolean
        shootingStarsEnabled: boolean
      }
      starCount: number
    }
    stars: CrossrefImportStar[]
  }
}

export type ImageMigrationStatus = 'uploaded' | 'skipped_existing' | 'failed'

export type ImageMigrationReportItem = {
  legacyUrl: string
  publicId: string
  format: string
  legacyDocIds: string[]
  storagePath: string
  downloadURL: string | null
  status: ImageMigrationStatus
  error: string | null
}

export type ImageMigrationReport = {
  generatedAt: string
  mode: 'dry-run' | 'execute'
  execute: boolean
  backupUri: string | null
  projectId: string | null
  bucketName: string
  sourceCrossrefPath: string
  summary: {
    expectedBaseline: {
      stars: number
      referencedAssets: number
      starsWithoutImage: number
      orphanedInStarsFolder: number
      missingInCloudinaryReport: number
    }
    candidates: number
    uploaded: number
    skippedExisting: number
    failed: number
    pathsMissingInCrossref: number
    invalidCandidates: number
  }
  items: ImageMigrationReportItem[]
}

export type StarMigrationStatus = 'upserted' | 'failed'

export type StarMigrationReportItem = {
  legacyDocId: string
  imagePath: string | null
  status: StarMigrationStatus
  error: string | null
}

export type StarMigrationReport = {
  generatedAt: string
  mode: 'dry-run' | 'execute'
  execute: boolean
  backupUri: string | null
  projectId: string | null
  bucketName: string | null
  sourceCrossrefPath: string
  sourceImagesPath: string
  skyId: string
  summary: {
    expectedBaseline: {
      stars: number
      referencedAssets: number
      starsWithoutImage: number
      orphanedInStarsFolder: number
      missingInCloudinaryReport: number
    }
    starsPlanned: number
    starsWithImagePath: number
    starsWithoutImagePath: number
    upserted: number
    failed: number
  }
  sky: {
    source: string
    importBatch: string
    claimStatus: string
    ownerUserId: null
    legacyCreatorKeys: string[]
  }
  stars: StarMigrationReportItem[]
}

export type ValidationReport = {
  generatedAt: string
  projectId: string | null
  bucketName: string
  sourceCrossrefPath: string
  sourceImagesPath: string
  summary: {
    expectedStars: number
    expectedMediaObjects: number
    starsWithoutImage: number
    orphanedExpectedExcluded: number
    errors: number
  }
  checks: {
    skyExists: boolean
    starsCountMatches: boolean
    starsMissing: string[]
    starsExtra: string[]
    duplicateLegacyDocIds: string[]
    coordinatesOutOfRange: string[]
    imagesMissingInStorage: string[]
    imagesExtraInStorage: string[]
    orphanedImported: string[]
    imagePathMismatches: string[]
    preservedFieldMismatches: string[]
    legacyCreatorKeyMismatches: string[]
  }
  errors: string[]
}

export type ExecutionOptions = {
  execute: boolean
  dryRun: boolean
  backupUri: string | null
}

type ServiceAccountJson = {
  project_id?: string
}

function parseBackupUri(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('gs://')) {
    throw new Error('Invalid --backup-uri. Expected format: gs://bucket/path')
  }
  return trimmed
}

export function parseExecutionOptions(argv: string[]): ExecutionOptions {
  let execute = false
  let dryRunFlag = false
  let backupUri: string | null = null

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--execute') {
      execute = true
      continue
    }

    if (arg === '--dry-run') {
      dryRunFlag = true
      continue
    }

    if (arg.startsWith('--backup-uri=')) {
      const value = arg.slice('--backup-uri='.length)
      backupUri = parseBackupUri(value)
      continue
    }

    if (arg === '--backup-uri') {
      const value = argv[index + 1]
      if (!value) {
        throw new Error('Missing value for --backup-uri')
      }
      backupUri = parseBackupUri(value)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (execute && dryRunFlag) {
    throw new Error('Use either --execute or --dry-run, not both')
  }

  if (execute && !backupUri) {
    throw new Error('Execution mode requires --backup-uri=gs://...')
  }

  if (!execute && backupUri) {
    throw new Error('--backup-uri is only allowed with --execute')
  }

  return {
    execute,
    dryRun: !execute,
    backupUri,
  }
}

export function ensureFile(path: string, message: string) {
  if (!existsSync(path)) {
    throw new Error(`${message}\nPath: ${path}`)
  }
}

export function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

export function writeJsonFile(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8')
}

export function buildDownloadUrl(bucketName: string, storagePath: string, token: string) {
  const encodedPath = encodeURIComponent(storagePath)
  const encodedToken = encodeURIComponent(token)
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${encodedToken}`
}

export function normalizeImageFormat(format: string) {
  return format.toLowerCase().trim()
}

export function contentTypeFromFormat(format: string) {
  const normalized = normalizeImageFormat(format)
  if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg'
  if (normalized === 'png') return 'image/png'
  if (normalized === 'gif') return 'image/gif'
  if (normalized === 'webp') return 'image/webp'
  if (normalized === 'svg') return 'image/svg+xml'
  if (normalized === 'bmp') return 'image/bmp'
  if (normalized === 'avif') return 'image/avif'
  return `image/${normalized}`
}

export function firstDownloadToken(fileMetadata: {
  metadata?: Record<string, string | number | boolean | null>
}) {
  const rawTokenValue = fileMetadata.metadata?.firebaseStorageDownloadTokens
  if (typeof rawTokenValue !== 'string' || !rawTokenValue) return null
  const token = rawTokenValue
    .split(',')
    .map((value) => value.trim())
    .find(Boolean)
  return token || null
}

export function ensureUnique(values: string[]) {
  return [...new Set(values)]
}

export type AdminContext = {
  app: App
  db: Firestore
  projectId: string | null
  bucketName: string | null
  bucket: ReturnType<ReturnType<typeof getStorage>['bucket']> | null
}

export function initAdminContext(options: { requireStorageBucket: boolean }): AdminContext {
  const serviceAccountPath = resolve(
    process.cwd(),
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './scripts/serviceAccountKey.json',
  )
  ensureFile(serviceAccountPath, 'Service account file was not found')

  const serviceAccount = readJsonFile<ServiceAccountJson>(serviceAccountPath)
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim() || null

  if (options.requireStorageBucket && !storageBucket) {
    throw new Error('Missing FIREBASE_STORAGE_BUCKET in environment')
  }

  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
        storageBucket: storageBucket ?? undefined,
      })

  const db = getFirestore(app)
  const storage = getStorage(app)
  const bucket = storageBucket ? storage.bucket(storageBucket) : null
  const projectId = (app.options.projectId as string | undefined) || serviceAccount.project_id || null

  return {
    app,
    db,
    projectId,
    bucketName: storageBucket,
    bucket,
  }
}

export function assertCrossrefBaseline(report: CrossrefReport) {
  if (report.summary.totalLegacyStars !== 27) {
    throw new Error(`Unexpected baseline: totalLegacyStars=${report.summary.totalLegacyStars}, expected 27`)
  }
  if (report.summary.referencedAssets !== 26) {
    throw new Error(`Unexpected baseline: referencedAssets=${report.summary.referencedAssets}, expected 26`)
  }
  if (report.summary.starsWithoutImage !== 1) {
    throw new Error(`Unexpected baseline: starsWithoutImage=${report.summary.starsWithoutImage}, expected 1`)
  }
  if (report.summary.orphanedInStarsFolder !== 1) {
    throw new Error(`Unexpected baseline: orphanedInStarsFolder=${report.summary.orphanedInStarsFolder}, expected 1`)
  }
  if (report.summary.starsWithMissingCloudinaryImage !== 0) {
    throw new Error(
      `Unexpected baseline: starsWithMissingCloudinaryImage=${report.summary.starsWithMissingCloudinaryImage}, expected 0`,
    )
  }
}
