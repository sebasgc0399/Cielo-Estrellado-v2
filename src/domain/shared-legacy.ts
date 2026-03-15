import type { SkyPersonalization } from './contracts'

export const SHARED_LEGACY_SKY_ID = 'shared-legacy-v1' as const
export const SHARED_LEGACY_IMPORT_BATCH = 'shared-legacy-v1' as const

export const DEFAULT_SKY_PERSONALIZATION: SkyPersonalization = {
  theme: 'classic',
  density: 'medium',
  nebulaEnabled: true,
  twinkleEnabled: true,
  shootingStarsEnabled: true,
}

/** @deprecated Fase 3 — mover a scripts/ al archivar tooling de migración */
export const SHARED_LEGACY_IMPORT_CONFIG = {
  skyId: SHARED_LEGACY_SKY_ID,
  title: 'Cielo legacy importado',
  source: 'legacy_import',
  importBatch: SHARED_LEGACY_IMPORT_BATCH,
  initialClaimStatus: 'unclaimed',
  ownershipAssignmentOnImport: 'none',
  defaultMemberRoleAfterFirstApprovedClaim: 'legacy_claimant',
  memberRolesAfterFullClaimResolution: ['owner', 'editor'],
  defaultPersonalization: DEFAULT_SKY_PERSONALIZATION,
} as const
