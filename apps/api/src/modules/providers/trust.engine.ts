/**
 * Provider trust-score engine — pure, deterministic, no I/O and no AI.
 *
 * Trust is *earned from real signals only*: an admin verification flag and the
 * provider's review history. Nothing is hardcoded per provider and no number is
 * fabricated. Review influence uses a Bayesian average so a single 5-star review
 * cannot inflate a score, and it is scaled by confidence so a provider with no
 * reviews cannot claim review-based trust at all.
 *
 * The result is cached on `providers.trustScore` and recomputed whenever the
 * inputs change (see providers.service.recomputeProviderTrust).
 */

// A listed-but-unproven provider starts here; evidence moves it up or down.
const NEUTRAL_BASE = 20
// Passing verification is a real, earned signal — but not a guarantee.
const VERIFIED_BONUS = 25
// Maximum points attainable from review evidence.
const MAX_REVIEW_POINTS = 55
// Neutral prior: 3.5 stars weighted as 3 pseudo-reviews (Bayesian shrinkage).
const PRIOR_RATING = 3.5
const PRIOR_WEIGHT = 3
// Never return a perfect 100: a score is evidence, not a guarantee of quality.
const SCORE_CAP = 98

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

/**
 * Computes a 0-100 trust score from verification + the list of review ratings.
 * `ratings` are raw 1-5 values; an empty list means "no review evidence yet".
 */
export function computeTrustScore(verified: boolean, ratings: number[]): number {
  const count = ratings.length
  const sum = ratings.reduce((a, r) => a + r, 0)

  // Confidence grows with review volume; 0 reviews => 0 review-based points.
  const confidence = count / (count + PRIOR_WEIGHT)
  const bayesAvg = (sum + PRIOR_RATING * PRIOR_WEIGHT) / (count + PRIOR_WEIGHT)
  const normalized = clamp((bayesAvg - 1) / 4, 0, 1) // map 1..5 -> 0..1
  const reviewPoints = normalized * MAX_REVIEW_POINTS * confidence

  const score = Math.round(NEUTRAL_BASE + (verified ? VERIFIED_BONUS : 0) + reviewPoints)
  return clamp(score, 0, SCORE_CAP)
}

/** Convenience helper: arithmetic mean rating, or null when there are none. */
export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null
  const avg = ratings.reduce((a, r) => a + r, 0) / ratings.length
  return Math.round(avg * 10) / 10
}
