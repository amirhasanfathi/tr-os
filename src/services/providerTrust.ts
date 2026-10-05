// Provider trust + price-band helpers (frontend mirror).
//
// `computeTrustScore` mirrors the server's pure trust engine
// (apps/api/src/modules/providers/trust.engine.ts) so mock mode derives the same
// score from the same real signals (verification + review ratings) instead of
// hardcoding one. In HTTP mode the server is authoritative and this is not used
// for the score — only `priceBand` runs, to turn real numeric prices into the
// prototype's display glyph.

const NEUTRAL_BASE = 20
const VERIFIED_BONUS = 25
const MAX_REVIEW_POINTS = 55
const PRIOR_RATING = 3.5
const PRIOR_WEIGHT = 3
const SCORE_CAP = 98

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

export function computeTrustScore(verified: boolean, ratings: number[]): number {
  const count = ratings.length
  const sum = ratings.reduce((a, r) => a + r, 0)
  const confidence = count / (count + PRIOR_WEIGHT)
  const bayesAvg = (sum + PRIOR_RATING * PRIOR_WEIGHT) / (count + PRIOR_WEIGHT)
  const normalized = clamp((bayesAvg - 1) / 4, 0, 1)
  const reviewPoints = normalized * MAX_REVIEW_POINTS * confidence
  const score = Math.round(NEUTRAL_BASE + (verified ? VERIFIED_BONUS : 0) + reviewPoints)
  return clamp(score, 0, SCORE_CAP)
}

const CURRENCY_SYMBOL: Record<string, string> = { TRY: '₺' }

export function priceBand(min: number | null, max: number | null, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? currency
  const rep = max ?? min ?? 0
  if (rep >= 20000) return `${sym}${sym}${sym}`
  if (rep >= 5000) return `${sym}${sym}`
  return sym
}
