import type { CareerSummaryDTO, JobMatchDTO, MatchedJobDTO } from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { env } from '../../config/env.js'
import { notFound } from '../../http/errors.js'
import { jobInclude, toJobResponse } from '../jobs/jobs.service.js'
import { computeCareerScore, computeJobMatch, computeSkillMatch, deriveRecommendations } from './career.engine.js'
import { enqueueRecompute, loadEngineProfile, recomputeUserMatches } from './matching.worker.js'
import type { ListMatchesQuery } from './career.validation.js'

/**
 * Ranks active jobs for the user from the cached `job_matches` table.
 *
 * The heavy recompute no longer runs on the request path (P10). Instead:
 *   - cold cache (no rows yet) → recompute once inline so the first load isn't empty;
 *   - stale/incomplete cache   → serve what we have now and refresh in the background;
 *   - fresh cache              → serve it, no work enqueued.
 * Scores always come from the deterministic engine — never hardcoded, never AI.
 */
export async function getMatchedJobs(userId: string, query: ListMatchesQuery): Promise<MatchedJobDTO[]> {
  const jobs = await prisma.job.findMany({
    where: {
      status: 'active',
      deletedAt: null,
      ...(query.source ? { source: { name: query.source } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { company: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: jobInclude,
    orderBy: { postedAt: 'desc' },
    take: query.limit,
  })
  if (jobs.length === 0) return []

  const jobIds = jobs.map((j) => j.id)
  const readCache = () =>
    prisma.jobMatch.findMany({ where: { userId, jobId: { in: jobIds } } })

  let cached = await readCache()

  // Cold cache: bootstrap once inline so the user is never shown an empty list.
  if (cached.length === 0) {
    await recomputeUserMatches(userId)
    cached = await readCache()
  } else {
    // Otherwise, refresh in the background when any listing is missing or stale.
    const cacheByJob = new Map(cached.map((c) => [c.jobId, c]))
    const expiry = Date.now() - env.MATCH_CACHE_TTL_MS
    const needsRefresh =
      jobIds.some((id) => !cacheByJob.has(id)) || cached.some((c) => c.computedAt.getTime() < expiry)
    if (needsRefresh) enqueueRecompute(userId)
  }

  const savedIds = new Set(
    (await prisma.savedJob.findMany({ where: { userId, jobId: { in: jobIds } }, select: { jobId: true } })).map(
      (s) => s.jobId,
    ),
  )

  const matchByJob = new Map(cached.map((c) => [c.jobId, c]))
  const matched: MatchedJobDTO[] = []
  for (const job of jobs) {
    const c = matchByJob.get(job.id)
    // A listing without a cached score yet is omitted until the worker fills it in.
    if (!c) continue
    matched.push({
      job: toJobResponse(job, savedIds.has(job.id)),
      match: {
        jobId: job.id,
        score: c.score,
        skillsScore: c.skillsScore,
        languageScore: c.languageScore,
        confidence: c.confidence,
        reasons: c.reasons as string[],
      },
    })
  }

  matched.sort((a, b) => b.match.score - a.match.score)
  return matched
}

export async function getMatch(userId: string, jobId: string): Promise<JobMatchDTO> {
  const profile = await loadEngineProfile(userId)
  const job = await prisma.job.findFirst({
    where: { id: jobId, status: 'active', deletedAt: null },
    include: { skills: { include: { skill: true } }, languages: { include: { language: true } } },
  })
  if (!job) throw notFound('Job not found')
  return computeJobMatch(profile, {
    id: job.id,
    skills: job.skills.map((s) => s.skill.name),
    languages: job.languages.map((l) => l.language.name),
  })
}

/**
 * Deterministic career summary: score, CV score, skill-match bars and
 * profile-derived guidance — all computed from real data, none fabricated.
 * `cvScore` equals `careerScore` until a dedicated CV-analysis module exists.
 */
export async function getCareerSummary(userId: string): Promise<CareerSummaryDTO> {
  const profile = await loadEngineProfile(userId)
  const careerScore = computeCareerScore(profile)
  return {
    careerScore,
    cvScore: careerScore,
    skillMatch: computeSkillMatch(profile),
    recommendations: deriveRecommendations(profile),
  }
}
