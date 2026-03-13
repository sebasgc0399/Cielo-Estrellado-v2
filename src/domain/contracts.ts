// Shared product and data contracts agreed before runtime implementation.

export type SkySource = 'native' | 'legacy_import'
export type SkyClaimStatus = 'unclaimed' | 'partially_claimed' | 'claimed' | 'disputed'
export type MemberRole = 'owner' | 'editor' | 'viewer' | 'legacy_claimant'
export type MemberStatus = 'active' | 'revoked' | 'pending'
export type SkyTheme = 'classic' | 'romantic' | 'deep-night'
export type SkyDensity = 'low' | 'medium' | 'high'
export type ClaimReviewStatus =
  | 'submitted'
  | 'approved_partial'
  | 'approved_final'
  | 'rejected'
  | 'revoked'
  | 'disputed'

export interface SkyPersonalization {
  theme: SkyTheme
  density: SkyDensity
  nebulaEnabled: boolean
  twinkleEnabled: boolean
  shootingStarsEnabled: boolean
}

export interface SkyRecord {
  title: string
  description: string | null
  ownerUserId: string | null
  privacy: 'private'
  source: SkySource
  importBatch: string | null
  legacyCreatorKeys: string[]
  claimStatus: SkyClaimStatus
  claimedByUserIds: string[]
  personalization: SkyPersonalization
}

export interface StarRecord {
  title: string | null
  message: string | null
  imagePath: string | null
  legacyUrl: string | null
  xNormalized: number | null
  yNormalized: number | null
  year: number | null
  authorUserId: string | null
  updatedByUserId: string | null
  legacyCreatorKey: string | null
  legacyDocId: string | null
}

export interface MemberRecord {
  userId: string
  role: MemberRole
  status: MemberStatus
  invitedByUserId: string | null
  claimedLegacyCreatorKey: string | null
}

export interface LegacyClaimRecord {
  skyId: string
  claimantUserId: string
  legacyCreatorKey: string
  status: ClaimReviewStatus
  evidenceSummary: string
  decisionReason: string | null
  reviewedByUserId: string | null
}

export const SHARED_LEGACY_IMPORT_BATCH = 'shared-legacy-v1' as const
export const SHARED_LEGACY_SKY_ID = 'shared-legacy-v1' as const

export const DEFAULT_SKY_PERSONALIZATION: SkyPersonalization = {
  theme: 'classic',
  density: 'medium',
  nebulaEnabled: true,
  twinkleEnabled: true,
  shootingStarsEnabled: true,
}

export const SESSION_COOKIE_TTL_MS = 5 * 24 * 60 * 60 * 1000
export const SESSION_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000
export const SESSION_COOKIE_SAME_SITE = 'lax' as const
