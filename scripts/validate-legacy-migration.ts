import './load-env'

import {
  assertCrossrefBaseline,
  CROSSREF_REPORT_PATH,
  IMAGES_REPORT_PATH,
  initAdminContext,
  readJsonFile,
  type CrossrefReport,
  type ImageMigrationReport,
  type ValidationReport,
  VALIDATION_REPORT_PATH,
  writeJsonFile,
} from './legacy-migration-utils'

function normalizeIso(value: unknown): string | null {
  if (typeof value === 'string') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toISOString()
  }
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  if (value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  const seconds = (value as { _seconds?: number } | null)?._seconds
  const nanos = (value as { _nanoseconds?: number } | null)?._nanoseconds ?? 0
  if (typeof seconds === 'number') {
    return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000)).toISOString()
  }
  return null
}

function asSortedStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string').sort()
}

function fieldMismatch(
  list: string[],
  legacyDocId: string,
  field: string,
  expected: unknown,
  actual: unknown,
) {
  list.push(`${legacyDocId}:${field} expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
}

async function main() {
  const crossrefReport = readJsonFile<CrossrefReport>(CROSSREF_REPORT_PATH)
  const imagesReport = readJsonFile<ImageMigrationReport>(IMAGES_REPORT_PATH)
  assertCrossrefBaseline(crossrefReport)

  const admin = initAdminContext({ requireStorageBucket: true })
  if (!admin.bucket || !admin.bucketName) {
    throw new Error('Storage bucket is not available')
  }

  const expectedStars = crossrefReport.importPlan.stars
  const expectedStarsById = new Map(expectedStars.map((star) => [star.legacyDocId, star]))
  const expectedStarIds = new Set(expectedStars.map((star) => star.legacyDocId))

  const errors: string[] = []
  const imagePathMismatches: string[] = []
  const preservedFieldMismatches: string[] = []
  const legacyCreatorKeyMismatches: string[] = []
  const coordinatesOutOfRange: string[] = []

  if (imagesReport.items.length !== crossrefReport.summary.referencedAssets) {
    errors.push(
      `Images report size mismatch: expected ${crossrefReport.summary.referencedAssets}, found ${imagesReport.items.length}`,
    )
  }

  if (imagesReport.summary.failed > 0 || imagesReport.items.some((item) => item.status === 'failed')) {
    errors.push('migration-images-report.json contains failed image migrations')
  }

  const imagePathByLegacyDocId = new Map<string, string>()
  const expectedStoragePaths = new Set<string>()
  for (const item of imagesReport.items) {
    if (item.status === 'failed') continue
    expectedStoragePaths.add(item.storagePath)
    for (const legacyDocId of item.legacyDocIds) {
      const existing = imagePathByLegacyDocId.get(legacyDocId)
      if (existing && existing !== item.storagePath) {
        errors.push(`Duplicate imagePath mapping for legacyDocId ${legacyDocId}`)
      }
      imagePathByLegacyDocId.set(legacyDocId, item.storagePath)
    }
  }

  for (const star of expectedStars) {
    if (star.legacyUrl && !imagePathByLegacyDocId.has(star.legacyDocId)) {
      errors.push(`Missing imagePath mapping for legacy star ${star.legacyDocId}`)
    }
    if (!star.legacyUrl && imagePathByLegacyDocId.has(star.legacyDocId)) {
      errors.push(`Unexpected imagePath mapping for image-less star ${star.legacyDocId}`)
    }
  }

  const skyPlan = crossrefReport.importPlan.sky
  const skyRef = admin.db.collection('skies').doc(skyPlan.skyId)
  const skySnapshot = await skyRef.get()
  const skyExists = skySnapshot.exists

  if (!skySnapshot.exists) {
    errors.push(`Sky ${skyPlan.skyId} not found`)
  } else {
    const skyData = skySnapshot.data() as Record<string, unknown>
    if (skyData.source !== 'legacy_import') {
      errors.push(`Sky source mismatch: expected legacy_import, found ${JSON.stringify(skyData.source)}`)
    }
    if (skyData.importBatch !== skyPlan.importBatch) {
      errors.push(`Sky importBatch mismatch: expected ${skyPlan.importBatch}, found ${JSON.stringify(skyData.importBatch)}`)
    }
    if (skyData.claimStatus !== 'unclaimed') {
      errors.push(`Sky claimStatus mismatch: expected unclaimed, found ${JSON.stringify(skyData.claimStatus)}`)
    }
    if (skyData.ownerUserId !== null) {
      errors.push(`Sky ownerUserId must be null, found ${JSON.stringify(skyData.ownerUserId)}`)
    }
    if (skyData.title !== skyPlan.title) {
      errors.push(`Sky title mismatch: expected ${JSON.stringify(skyPlan.title)}, found ${JSON.stringify(skyData.title)}`)
    }

    const expectedKeys = [...skyPlan.legacyCreatorKeys].sort()
    const actualKeys = asSortedStringArray(skyData.legacyCreatorKeys)
    if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys)) {
      errors.push(
        `Sky legacyCreatorKeys mismatch: expected ${JSON.stringify(expectedKeys)}, found ${JSON.stringify(actualKeys)}`,
      )
    }
  }

  const starsSnapshot = await skyRef.collection('stars').get()
  const actualStarsById = new Map(starsSnapshot.docs.map((doc) => [doc.id, doc.data() as Record<string, unknown>]))
  const actualStarIds = new Set(starsSnapshot.docs.map((doc) => doc.id))

  const starsMissing = [...expectedStarIds].filter((id) => !actualStarIds.has(id)).sort()
  const starsExtra = [...actualStarIds].filter((id) => !expectedStarIds.has(id)).sort()

  if (starsSnapshot.size !== expectedStars.length) {
    errors.push(`Stars count mismatch: expected ${expectedStars.length}, found ${starsSnapshot.size}`)
  }
  if (starsMissing.length > 0) {
    errors.push(`Missing stars: ${starsMissing.join(', ')}`)
  }
  if (starsExtra.length > 0) {
    errors.push(`Extra stars: ${starsExtra.join(', ')}`)
  }

  const legacyDocIdFrequency = new Map<string, number>()
  for (const [docId, data] of actualStarsById.entries()) {
    const legacyDocId = typeof data.legacyDocId === 'string' ? data.legacyDocId : docId
    legacyDocIdFrequency.set(legacyDocId, (legacyDocIdFrequency.get(legacyDocId) || 0) + 1)
  }
  const duplicateLegacyDocIds = [...legacyDocIdFrequency.entries()]
    .filter(([, count]) => count > 1)
    .map(([legacyDocId]) => legacyDocId)
    .sort()
  if (duplicateLegacyDocIds.length > 0) {
    errors.push(`Duplicate legacyDocId values: ${duplicateLegacyDocIds.join(', ')}`)
  }

  for (const [legacyDocId, actual] of actualStarsById.entries()) {
    const expected = expectedStarsById.get(legacyDocId)
    if (!expected) continue

    const expectedImagePath = expected.legacyUrl ? imagePathByLegacyDocId.get(legacyDocId) || null : null
    if (actual.imagePath !== expectedImagePath) {
      imagePathMismatches.push(
        `${legacyDocId}: expected ${JSON.stringify(expectedImagePath)}, found ${JSON.stringify(actual.imagePath)}`,
      )
    }

    if (actual.legacyDocId !== legacyDocId) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'legacyDocId', legacyDocId, actual.legacyDocId)
    }
    if (actual.legacyUrl !== expected.legacyUrl) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'legacyUrl', expected.legacyUrl, actual.legacyUrl)
    }
    if (actual.title !== expected.title) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'title', expected.title, actual.title)
    }
    if (actual.message !== expected.message) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'message', expected.message, actual.message)
    }
    if (actual.year !== expected.year) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'year', expected.year, actual.year)
    }
    if (actual.xNormalized !== expected.xNormalized) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'xNormalized', expected.xNormalized, actual.xNormalized)
    }
    if (actual.yNormalized !== expected.yNormalized) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'yNormalized', expected.yNormalized, actual.yNormalized)
    }

    const expectedCreatedAt = expected.createdAtISO
    const actualCreatedAt = normalizeIso(actual.createdAt)
    if (expectedCreatedAt && actualCreatedAt !== expectedCreatedAt) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'createdAt', expectedCreatedAt, actualCreatedAt)
    }

    if (actual.authorUserId !== null) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'authorUserId', null, actual.authorUserId)
    }
    if (actual.updatedByUserId !== null) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'updatedByUserId', null, actual.updatedByUserId)
    }
    if (actual.deletedAt !== null) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'deletedAt', null, actual.deletedAt)
    }
    if (actual.deletedByUserId !== null) {
      fieldMismatch(preservedFieldMismatches, legacyDocId, 'deletedByUserId', null, actual.deletedByUserId)
    }

    if (actual.legacyCreatorKey !== expected.legacyCreatorKey) {
      legacyCreatorKeyMismatches.push(
        `${legacyDocId}: expected ${JSON.stringify(expected.legacyCreatorKey)}, found ${JSON.stringify(actual.legacyCreatorKey)}`,
      )
    }

    const xNormalized = actual.xNormalized
    if (xNormalized !== null && (typeof xNormalized !== 'number' || xNormalized < 0 || xNormalized > 1)) {
      coordinatesOutOfRange.push(`${legacyDocId}:xNormalized=${JSON.stringify(xNormalized)}`)
    }
    const yNormalized = actual.yNormalized
    if (yNormalized !== null && (typeof yNormalized !== 'number' || yNormalized < 0 || yNormalized > 1)) {
      coordinatesOutOfRange.push(`${legacyDocId}:yNormalized=${JSON.stringify(yNormalized)}`)
    }
  }

  if (imagePathMismatches.length > 0) {
    errors.push(`imagePath mismatches found: ${imagePathMismatches.length}`)
  }
  if (preservedFieldMismatches.length > 0) {
    errors.push(`Field preservation mismatches found: ${preservedFieldMismatches.length}`)
  }
  if (legacyCreatorKeyMismatches.length > 0) {
    errors.push(`legacyCreatorKey mismatches found: ${legacyCreatorKeyMismatches.length}`)
  }
  if (coordinatesOutOfRange.length > 0) {
    errors.push(`Coordinates out of range found: ${coordinatesOutOfRange.length}`)
  }

  const [storageFiles] = await admin.bucket.getFiles({ prefix: 'legacy/stars/' })
  const actualStoragePaths = storageFiles
    .map((file) => file.name)
    .filter((name) => name.startsWith('legacy/stars/') && !name.endsWith('/'))

  const imagesMissingInStorage = [...expectedStoragePaths].filter((path) => !actualStoragePaths.includes(path)).sort()
  const imagesExtraInStorage = actualStoragePaths.filter((path) => !expectedStoragePaths.has(path)).sort()

  if (imagesMissingInStorage.length > 0) {
    errors.push(`Missing media objects in Storage: ${imagesMissingInStorage.length}`)
  }
  if (imagesExtraInStorage.length > 0) {
    errors.push(`Unexpected extra media objects in Storage: ${imagesExtraInStorage.length}`)
  }

  const orphanedImported = crossrefReport.orphaned_in_stars
    .map((asset) => asset.public_id)
    .filter((publicId) => publicId.startsWith('stars/'))
    .map((publicId) => publicId.replace('stars/', ''))
    .flatMap((legacyId) =>
      actualStoragePaths.filter((path) => path.startsWith(`legacy/stars/${legacyId}.`)),
    )
    .sort()

  if (orphanedImported.length > 0) {
    errors.push(`Orphaned asset imported to Storage: ${orphanedImported.join(', ')}`)
  }

  const report: ValidationReport = {
    generatedAt: new Date().toISOString(),
    projectId: admin.projectId,
    bucketName: admin.bucketName,
    sourceCrossrefPath: CROSSREF_REPORT_PATH,
    sourceImagesPath: IMAGES_REPORT_PATH,
    summary: {
      expectedStars: expectedStars.length,
      expectedMediaObjects: expectedStoragePaths.size,
      starsWithoutImage: crossrefReport.summary.starsWithoutImage,
      orphanedExpectedExcluded: crossrefReport.summary.orphanedInStarsFolder,
      errors: errors.length,
    },
    checks: {
      skyExists,
      starsCountMatches: starsSnapshot.size === expectedStars.length,
      starsMissing,
      starsExtra,
      duplicateLegacyDocIds,
      coordinatesOutOfRange,
      imagesMissingInStorage,
      imagesExtraInStorage,
      orphanedImported,
      imagePathMismatches,
      preservedFieldMismatches,
      legacyCreatorKeyMismatches,
    },
    errors,
  }

  writeJsonFile(VALIDATION_REPORT_PATH, report)

  console.log('=== LEGACY MIGRATION VALIDATION ===')
  console.log(`Project: ${report.projectId ?? 'unknown'}`)
  console.log(`Bucket: ${report.bucketName}`)
  console.log(`Expected stars: ${report.summary.expectedStars}`)
  console.log(`Expected media objects: ${report.summary.expectedMediaObjects}`)
  console.log(`Errors: ${report.summary.errors}`)
  console.log(`Report: ${VALIDATION_REPORT_PATH}`)

  if (errors.length > 0) {
    throw new Error('Validation failed. Check migration-validation-report.json')
  }
}

main().catch((error) => {
  console.error('Validation aborted:', error instanceof Error ? error.message : error)
  process.exit(1)
})
