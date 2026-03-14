import './load-env'

import {
  assertCrossrefBaseline,
  CROSSREF_REPORT_PATH,
  IMAGES_REPORT_PATH,
  initAdminContext,
  parseExecutionOptions,
  readJsonFile,
  STARS_REPORT_PATH,
  type CrossrefImportStar,
  type CrossrefReport,
  type ImageMigrationReport,
  type StarMigrationReport,
  type StarMigrationReportItem,
  writeJsonFile,
} from './legacy-migration-utils'

type StarPayload = {
  title: string | null
  message: string | null
  imagePath: string | null
  legacyUrl: string | null
  xNormalized: number | null
  yNormalized: number | null
  year: number | null
  authorUserId: null
  updatedByUserId: null
  legacyCreatorKey: string | null
  legacyDocId: string
  createdAt: string
  updatedAt: string
  deletedAt: null
  deletedByUserId: null
}

function imagePathByLegacyDocId(imagesReport: ImageMigrationReport) {
  const map = new Map<string, string>()

  for (const item of imagesReport.items) {
    if (item.status === 'failed') continue
    for (const legacyDocId of item.legacyDocIds) {
      const existing = map.get(legacyDocId)
      if (existing && existing !== item.storagePath) {
        throw new Error(`Conflicting imagePath for legacyDocId ${legacyDocId}`)
      }
      map.set(legacyDocId, item.storagePath)
    }
  }

  return map
}

function buildStarPayload(star: CrossrefImportStar, imagePath: string | null): StarPayload {
  const createdAt = star.createdAtISO || new Date().toISOString()
  return {
    title: star.title,
    message: star.message,
    imagePath,
    legacyUrl: star.legacyUrl,
    xNormalized: star.xNormalized,
    yNormalized: star.yNormalized,
    year: star.year,
    authorUserId: null,
    updatedByUserId: null,
    legacyCreatorKey: star.legacyCreatorKey,
    legacyDocId: star.legacyDocId,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedByUserId: null,
  }
}

async function main() {
  const options = parseExecutionOptions(process.argv.slice(2))
  const crossrefReport = readJsonFile<CrossrefReport>(CROSSREF_REPORT_PATH)
  const imagesReport = readJsonFile<ImageMigrationReport>(IMAGES_REPORT_PATH)

  assertCrossrefBaseline(crossrefReport)

  const failedImages = imagesReport.items.filter((item) => item.status === 'failed')
  if (failedImages.length > 0 || imagesReport.summary.failed > 0) {
    throw new Error('migration-images-report.json contains failed items')
  }

  if (imagesReport.items.length !== crossrefReport.summary.referencedAssets) {
    throw new Error(
      `Expected ${crossrefReport.summary.referencedAssets} image entries, found ${imagesReport.items.length}`,
    )
  }

  if (options.execute && imagesReport.mode !== 'execute') {
    throw new Error('migrate:stars --execute requires migration-images-report.json generated in execute mode')
  }

  const imagePathMap = imagePathByLegacyDocId(imagesReport)
  const starsWithImage = crossrefReport.importPlan.stars.filter((star) => Boolean(star.legacyUrl))
  for (const star of starsWithImage) {
    if (!imagePathMap.has(star.legacyDocId)) {
      throw new Error(`Missing imagePath for star ${star.legacyDocId}`)
    }
  }

  const admin = initAdminContext({ requireStorageBucket: false })
  const skyPlan = crossrefReport.importPlan.sky
  const nowIso = new Date().toISOString()
  const skyRef = admin.db.collection('skies').doc(skyPlan.skyId)

  const skyPayload = {
    title: skyPlan.title,
    description: null,
    ownerUserId: null,
    privacy: 'private' as const,
    coverImagePath: null,
    source: 'legacy_import' as const,
    importBatch: skyPlan.importBatch,
    legacyCreatorKeys: [...skyPlan.legacyCreatorKeys].sort(),
    claimStatus: 'unclaimed' as const,
    claimedByUserIds: [],
    personalization: skyPlan.personalization,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  if (options.execute) {
    await skyRef.set(skyPayload, { merge: true })
  }

  const starResults: StarMigrationReportItem[] = []
  for (const legacyStar of crossrefReport.importPlan.stars) {
    const expectedImagePath = legacyStar.legacyUrl ? imagePathMap.get(legacyStar.legacyDocId) || null : null
    const payload = buildStarPayload(legacyStar, expectedImagePath)

    try {
      if (options.execute) {
        const starRef = skyRef.collection('stars').doc(legacyStar.legacyDocId)
        await starRef.set(payload, { merge: true })
      }

      starResults.push({
        legacyDocId: legacyStar.legacyDocId,
        imagePath: payload.imagePath,
        status: 'upserted',
        error: null,
      })
    } catch (error) {
      starResults.push({
        legacyDocId: legacyStar.legacyDocId,
        imagePath: payload.imagePath,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const upserted = starResults.filter((result) => result.status === 'upserted').length
  const failed = starResults.filter((result) => result.status === 'failed').length
  const starsWithImagePath = starResults.filter((result) => result.imagePath !== null).length
  const starsWithoutImagePath = starResults.length - starsWithImagePath

  const report: StarMigrationReport = {
    generatedAt: new Date().toISOString(),
    mode: options.execute ? 'execute' : 'dry-run',
    execute: options.execute,
    backupUri: options.backupUri,
    projectId: admin.projectId,
    bucketName: imagesReport.bucketName || null,
    sourceCrossrefPath: CROSSREF_REPORT_PATH,
    sourceImagesPath: IMAGES_REPORT_PATH,
    skyId: skyPlan.skyId,
    summary: {
      expectedBaseline: {
        stars: crossrefReport.summary.totalLegacyStars,
        referencedAssets: crossrefReport.summary.referencedAssets,
        starsWithoutImage: crossrefReport.summary.starsWithoutImage,
        orphanedInStarsFolder: crossrefReport.summary.orphanedInStarsFolder,
        missingInCloudinaryReport: crossrefReport.summary.starsWithMissingCloudinaryImage,
      },
      starsPlanned: starResults.length,
      starsWithImagePath,
      starsWithoutImagePath,
      upserted,
      failed,
    },
    sky: {
      source: skyPayload.source,
      importBatch: skyPayload.importBatch,
      claimStatus: skyPayload.claimStatus,
      ownerUserId: skyPayload.ownerUserId,
      legacyCreatorKeys: skyPayload.legacyCreatorKeys,
    },
    stars: starResults,
  }

  writeJsonFile(STARS_REPORT_PATH, report)

  console.log('=== LEGACY STAR MIGRATION ===')
  console.log(`Mode: ${report.mode}`)
  console.log(`Project: ${report.projectId ?? 'unknown'}`)
  console.log(`Sky: ${report.skyId}`)
  console.log(`Stars planned: ${report.summary.starsPlanned}`)
  console.log(`Stars with imagePath: ${report.summary.starsWithImagePath}`)
  console.log(`Stars without imagePath: ${report.summary.starsWithoutImagePath}`)
  console.log(`Upserted: ${report.summary.upserted}`)
  console.log(`Failed: ${report.summary.failed}`)
  console.log(`Report: ${STARS_REPORT_PATH}`)

  if (failed > 0) {
    throw new Error(`Star migration finished with ${failed} failed stars`)
  }
}

main().catch((error) => {
  console.error('Star migration aborted:', error instanceof Error ? error.message : error)
  process.exit(1)
})
