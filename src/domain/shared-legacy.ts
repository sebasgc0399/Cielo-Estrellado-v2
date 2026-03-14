import type { MemberRole, SkyClaimStatus, SkyPersonalization, SkySource } from './contracts'

export const SHARED_LEGACY_SKY_ID = 'shared-legacy-v1' as const
export const SHARED_LEGACY_IMPORT_BATCH = 'shared-legacy-v1' as const

export const DEFAULT_SKY_PERSONALIZATION: SkyPersonalization = {
  theme: 'classic',
  density: 'medium',
  nebulaEnabled: true,
  twinkleEnabled: true,
  shootingStarsEnabled: true,
}

export type SharedLegacyImportConfig = {
  skyId: typeof SHARED_LEGACY_SKY_ID
  title: string
  source: Extract<SkySource, 'legacy_import'>
  importBatch: typeof SHARED_LEGACY_IMPORT_BATCH
  initialClaimStatus: Extract<SkyClaimStatus, 'unclaimed'>
  ownershipAssignmentOnImport: 'none'
  defaultMemberRoleAfterFirstApprovedClaim: Extract<MemberRole, 'legacy_claimant'>
  memberRolesAfterFullClaimResolution: readonly [Extract<MemberRole, 'owner'>, Extract<MemberRole, 'editor'>]
  defaultPersonalization: SkyPersonalization
}

export const SHARED_LEGACY_IMPORT_CONFIG: SharedLegacyImportConfig = {
  skyId: SHARED_LEGACY_SKY_ID,
  title: 'Cielo legacy importado',
  source: 'legacy_import',
  importBatch: SHARED_LEGACY_IMPORT_BATCH,
  initialClaimStatus: 'unclaimed',
  ownershipAssignmentOnImport: 'none',
  defaultMemberRoleAfterFirstApprovedClaim: 'legacy_claimant',
  memberRolesAfterFullClaimResolution: ['owner', 'editor'],
  defaultPersonalization: DEFAULT_SKY_PERSONALIZATION,
}
