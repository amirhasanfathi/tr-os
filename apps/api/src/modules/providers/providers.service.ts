import type { ProviderDetailDTO, ProviderResponse, ProviderReviewDTO } from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'
import { computeTrustScore } from './trust.engine.js'
import type { CreateReviewInput, ListProvidersQuery } from './providers.validation.js'

/**
 * Provider marketplace reads + the review pipeline that feeds the trust score.
 *
 * `providers.trustScore` is a CACHE, not the source of truth: it is recomputed
 * from real signals (verification + reviews) whenever a review is added, and read
 * back on the list/detail endpoints so browsing stays cheap and sortable. Scores
 * are never taken from the client and never hardcoded.
 */

type ReviewStat = { providerId: string; count: number; avg: number | null }

async function reviewStats(providerIds: string[]): Promise<Map<string, ReviewStat>> {
  if (providerIds.length === 0) return new Map()
  const grouped = await prisma.providerReview.groupBy({
    by: ['providerId'],
    where: { providerId: { in: providerIds } },
    _avg: { rating: true },
    _count: { rating: true },
  })
  const map = new Map<string, ReviewStat>()
  for (const g of grouped) {
    map.set(g.providerId, {
      providerId: g.providerId,
      count: g._count.rating,
      avg: g._avg.rating == null ? null : Math.round(g._avg.rating * 10) / 10,
    })
  }
  return map
}

function toProviderResponse(
  p: {
    id: string
    name: string
    category: string
    specialty: string
    location: string
    languages: string[]
    priceMin: number | null
    priceMax: number | null
    currency: string
    trustScore: number
    verified: boolean
  },
  stat: ReviewStat | undefined,
): ProviderResponse {
  return {
    id: p.id,
    name: p.name,
    category: p.category as ProviderResponse['category'],
    specialty: p.specialty,
    location: p.location,
    languages: p.languages,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    currency: p.currency,
    trustScore: p.trustScore,
    verified: p.verified,
    reviewCount: stat?.count ?? 0,
    averageRating: stat?.avg ?? null,
  }
}

function toReviewDTO(r: { id: string; rating: number; comment: string | null; createdAt: Date }): ProviderReviewDTO {
  return { id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString() }
}

export async function listProviders(query: ListProvidersQuery): Promise<ProviderResponse[]> {
  const providers = await prisma.provider.findMany({
    where: {
      status: 'active',
      deletedAt: null,
      ...(query.category ? { category: query.category as ProviderResponse['category'] } : {}),
    },
    orderBy: [{ trustScore: 'desc' }, { createdAt: 'desc' }],
    take: query.limit,
  })
  const stats = await reviewStats(providers.map((p) => p.id))
  return providers.map((p) => toProviderResponse(p, stats.get(p.id)))
}

export async function getProvider(id: string): Promise<ProviderDetailDTO> {
  const provider = await prisma.provider.findFirst({ where: { id, status: 'active', deletedAt: null } })
  if (!provider) throw notFound('Provider not found')
  const stats = await reviewStats([provider.id])
  const reviews = await prisma.providerReview.findMany({
    where: { providerId: provider.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return { ...toProviderResponse(provider, stats.get(provider.id)), reviews: reviews.map(toReviewDTO) }
}

export async function listReviews(providerId: string): Promise<ProviderReviewDTO[]> {
  const provider = await prisma.provider.findFirst({ where: { id: providerId, deletedAt: null } })
  if (!provider) throw notFound('Provider not found')
  const reviews = await prisma.providerReview.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' },
  })
  return reviews.map(toReviewDTO)
}

/**
 * Recomputes and stores a provider's trust score from its real signals.
 * Called after any review mutation so the cached score never drifts.
 */
export async function recomputeProviderTrust(providerId: string): Promise<number> {
  const provider = await prisma.provider.findFirst({ where: { id: providerId, deletedAt: null } })
  if (!provider) throw notFound('Provider not found')
  const reviews = await prisma.providerReview.findMany({
    where: { providerId },
    select: { rating: true },
  })
  const trustScore = computeTrustScore(
    provider.verified,
    reviews.map((r) => r.rating),
  )
  await prisma.provider.update({ where: { id: providerId }, data: { trustScore } })
  return trustScore
}

/**
 * Adds a review. Authorship comes from the authenticated token, never the body.
 * The provider's trust score is recomputed synchronously (reviews are low-frequency
 * writes, so no queue is needed here).
 */
export async function createReview(
  authorId: string,
  providerId: string,
  input: CreateReviewInput,
): Promise<ProviderReviewDTO> {
  const provider = await prisma.provider.findFirst({ where: { id: providerId, status: 'active', deletedAt: null } })
  if (!provider) throw notFound('Provider not found')

  const review = await prisma.providerReview.create({
    data: {
      providerId,
      authorId,
      rating: input.rating,
      comment: input.comment ?? null,
    },
  })
  await recomputeProviderTrust(providerId)
  return toReviewDTO(review)
}
