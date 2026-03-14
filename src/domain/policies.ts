import type { ClaimReviewStatus } from './contracts'

export const SESSION_COOKIE_TTL_MS = 5 * 24 * 60 * 60 * 1000
export const SESSION_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000
export const SESSION_COOKIE_SAME_SITE = 'lax' as const

export const CLAIM_REQUIRES_VERIFIED_EMAIL = true as const
export const CLAIM_ACTIVE_STATUSES = ['submitted', 'approved_partial'] as const satisfies readonly ClaimReviewStatus[]
export const CLAIM_ADMIN_REOPEN_ONLY_STATUSES = ['rejected', 'revoked', 'disputed'] as const satisfies readonly ClaimReviewStatus[]
