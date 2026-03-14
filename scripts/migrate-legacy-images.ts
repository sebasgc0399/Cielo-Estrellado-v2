import './load-env'

import { randomUUID } from 'node:crypto'
import {
  assertCrossrefBaseline,
  buildDownloadUrl,
  contentTypeFromFormat,
  CROSSREF_REPORT_PATH,
  firstDownloadToken,
  IMAGES_REPORT_PATH,
  initAdminContext,
  normalizeImageFormat,
  parseExecutionOptions,
  readJsonFile,
  type CrossrefReport,
  type ImageMigrationReport,
  type ImageMigrationReportItem,
  writeJsonFile,
} from './legacy-migration-utils'

type UploadCandidate = {
  legacyUrl: string
  publicId: string
  format: string
  legacyDocIds: string[]
  storagePath: string
}

type CandidateBuildResult = {
  candidates: UploadCandidate[]
  pathsMissingInCrossref: number
  invalidCandidates: number
}

function buildCandidates(report: CrossrefReport): CandidateBuildResult {
  const starsById = new Map(report.importPlan.stars.map((star) => [star.legacyDocId, star]))
  const candidates: UploadCandidate[] = []
  let pathsMissingInCrossref = 0
  let invalidCandidates = 0
  const seenStoragePaths = new Set<string>()

  for (const asset of report.referenced) {
    const normalizedFormat = normalizeImageFormat(asset.format || '')
    if (!asset.url || !normalizedFormat || !asset.public_id.startsWith('stars/')) {
      invalidCandidates += 1
      continue
    }

    if (!asset.legacyDocIds.length) {
      invalidCandidates += 1
      continue
    }

    for (const legacyDocId of asset.legacyDocIds) {
      const star = starsById.get(legacyDocId)
      if (!star || !star.legacyUrl || star.legacyUrl !== asset.url) {
        invalidCandidates += 1
        continue
      }

      const storagePath = `legacy/stars/${legacyDocId}.${normalizedFormat}`
      if (star.recommendedStoragePath !== storagePath) {
        pathsMissingInCrossref += 1
      }
      if (seenStoragePaths.has(storagePath)) {
        invalidCandidates += 1
        continue
      }

      seenStoragePaths.add(storagePath)
      candidates.push({
        legacyUrl: asset.url,
        publicId: asset.public_id,
        format: normalizedFormat,
        legacyDocIds: [legacyDocId],
        storagePath,
      })
    }
  }

  return {
    candidates,
    pathsMissingInCrossref,
    invalidCandidates,
  }
}

async function main() {
  const options = parseExecutionOptions(process.argv.slice(2))
  const crossrefReport = readJsonFile<CrossrefReport>(CROSSREF_REPORT_PATH)
  assertCrossrefBaseline(crossrefReport)

  const { candidates, pathsMissingInCrossref, invalidCandidates } = buildCandidates(crossrefReport)
  if (pathsMissingInCrossref > 0) {
    throw new Error(`Crossref report contains ${pathsMissingInCrossref} stars without a valid recommendedStoragePath`)
  }
  if (invalidCandidates > 0) {
    throw new Error(`Crossref report contains ${invalidCandidates} invalid image candidates`)
  }
  if (candidates.length !== crossrefReport.summary.referencedAssets) {
    throw new Error(
      `Expected ${crossrefReport.summary.referencedAssets} image candidates from crossref, found ${candidates.length}`,
    )
  }

  const admin = initAdminContext({ requireStorageBucket: true })
  if (!admin.bucket || !admin.bucketName) {
    throw new Error('Storage bucket is not available')
  }

  const reportItems: ImageMigrationReportItem[] = []

  for (const candidate of candidates) {
    try {
      const file = admin.bucket.file(candidate.storagePath)
      const [exists] = await file.exists()

      if (exists) {
        const [metadata] = await file.getMetadata()
        let token = firstDownloadToken(metadata)

        if (!token && options.execute) {
          token = randomUUID()
          await file.setMetadata({
            metadata: {
              ...(metadata.metadata || {}),
              firebaseStorageDownloadTokens: token,
            },
          })
        }

        reportItems.push({
          legacyUrl: candidate.legacyUrl,
          publicId: candidate.publicId,
          format: candidate.format,
          legacyDocIds: candidate.legacyDocIds,
          storagePath: candidate.storagePath,
          downloadURL: token ? buildDownloadUrl(admin.bucketName, candidate.storagePath, token) : null,
          status: 'skipped_existing',
          error: null,
        })
        continue
      }

      if (options.dryRun) {
        reportItems.push({
          legacyUrl: candidate.legacyUrl,
          publicId: candidate.publicId,
          format: candidate.format,
          legacyDocIds: candidate.legacyDocIds,
          storagePath: candidate.storagePath,
          downloadURL: null,
          status: 'uploaded',
          error: null,
        })
        continue
      }

      const response = await fetch(candidate.legacyUrl)
      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`)
      }

      const body = Buffer.from(await response.arrayBuffer())
      const downloadToken = randomUUID()

      await file.save(body, {
        resumable: false,
        metadata: {
          contentType: contentTypeFromFormat(candidate.format),
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            legacyUrl: candidate.legacyUrl,
            legacyDocIds: candidate.legacyDocIds.join(','),
          },
        },
      })

      reportItems.push({
        legacyUrl: candidate.legacyUrl,
        publicId: candidate.publicId,
        format: candidate.format,
        legacyDocIds: candidate.legacyDocIds,
        storagePath: candidate.storagePath,
        downloadURL: buildDownloadUrl(admin.bucketName, candidate.storagePath, downloadToken),
        status: 'uploaded',
        error: null,
      })
    } catch (error) {
      reportItems.push({
        legacyUrl: candidate.legacyUrl,
        publicId: candidate.publicId,
        format: candidate.format,
        legacyDocIds: candidate.legacyDocIds,
        storagePath: candidate.storagePath,
        downloadURL: null,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const uploaded = reportItems.filter((item) => item.status === 'uploaded').length
  const skippedExisting = reportItems.filter((item) => item.status === 'skipped_existing').length
  const failed = reportItems.filter((item) => item.status === 'failed').length

  const report: ImageMigrationReport = {
    generatedAt: new Date().toISOString(),
    mode: options.execute ? 'execute' : 'dry-run',
    execute: options.execute,
    backupUri: options.backupUri,
    projectId: admin.projectId,
    bucketName: admin.bucketName,
    sourceCrossrefPath: CROSSREF_REPORT_PATH,
    summary: {
      expectedBaseline: {
        stars: crossrefReport.summary.totalLegacyStars,
        referencedAssets: crossrefReport.summary.referencedAssets,
        starsWithoutImage: crossrefReport.summary.starsWithoutImage,
        orphanedInStarsFolder: crossrefReport.summary.orphanedInStarsFolder,
        missingInCloudinaryReport: crossrefReport.summary.starsWithMissingCloudinaryImage,
      },
      candidates: candidates.length,
      uploaded,
      skippedExisting,
      failed,
      pathsMissingInCrossref,
      invalidCandidates,
    },
    items: reportItems,
  }

  writeJsonFile(IMAGES_REPORT_PATH, report)

  console.log('=== LEGACY IMAGE MIGRATION ===')
  console.log(`Mode: ${report.mode}`)
  console.log(`Project: ${report.projectId ?? 'unknown'}`)
  console.log(`Bucket: ${report.bucketName}`)
  console.log(`Candidates: ${report.summary.candidates}`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Skipped existing: ${skippedExisting}`)
  console.log(`Failed: ${failed}`)
  console.log(`Report: ${IMAGES_REPORT_PATH}`)

  if (failed > 0) {
    throw new Error(`Image migration finished with ${failed} failed candidates`)
  }
}

main().catch((error) => {
  console.error('Image migration aborted:', error instanceof Error ? error.message : error)
  process.exit(1)
})
