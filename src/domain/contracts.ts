// Normalized persisted domain records for runtime and migration work.

export type IsoDateString = string

export type SkySource = 'native' | 'legacy_import'
export type SkyClaimStatus = 'unclaimed' | 'partially_claimed' | 'claimed' | 'disputed'
export type SkyPrivacy = 'private'
export type MemberRole = 'owner' | 'editor' | 'viewer' | 'legacy_claimant'
export type MemberStatus = 'active' | 'revoked' | 'pending'
export type UserStatus = 'active' | 'pending' | 'disabled'
export type InviteRole = 'editor' | 'viewer'
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
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

export interface UserRecord {
  displayName: string | null
  email: string
  photoURL: string | null
  providers: string[]
  emailVerifiedAt: IsoDateString | null
  createdAt: IsoDateString
  lastLoginAt: IsoDateString | null
  status: UserStatus
  sessionVersion: number
}

export interface SkyRecord {
  title: string
  description: string | null
  ownerUserId: string | null
  privacy: SkyPrivacy
  coverImagePath: string | null
  source: SkySource
  importBatch: string | null
  legacyCreatorKeys: string[]
  claimStatus: SkyClaimStatus
  claimedByUserIds: string[]
  personalization: SkyPersonalization
  createdAt: IsoDateString
  updatedAt: IsoDateString
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
  createdAt: IsoDateString
  updatedAt: IsoDateString
  deletedAt: IsoDateString | null
  deletedByUserId: string | null
}

export interface MemberRecord {
  userId: string
  role: MemberRole
  status: MemberStatus
  invitedByUserId: string | null
  claimedLegacyCreatorKey: string | null
  joinedAt: IsoDateString
}

export interface InviteRecord {
  skyId: string
  role: InviteRole
  tokenHash: string
  createdByUserId: string
  expiresAt: IsoDateString
  status: InviteStatus
  acceptedByUserId: string | null
  acceptedAt: IsoDateString | null
}

export interface LegacyClaimRecord {
  claimKey: string
  skyId: string
  claimantUserId: string
  legacyCreatorKey: string
  status: ClaimReviewStatus
  evidenceSummary: string
  decisionReason: string | null
  attemptCount: number
  lastSubmittedAt: IsoDateString
  submittedAt: IsoDateString
  reviewedAt: IsoDateString | null
  reviewedByUserId: string | null
}
