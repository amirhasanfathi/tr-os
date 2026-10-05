import type { LanguageLevel } from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'
import { enqueue, registerWorker } from '../../queue/index.js'
import { jobInclude } from '../jobs/jobs.service.js'
import { computeJobMatch, type EngineProfile } from './career.engine.js'

/**
 * Background recomputation of job matches (P10).
 *
 * The deterministic engine (career.engine.ts) is unchanged; this module only moves
 * *when* it runs off the request path. Recompute is triggered by:
 *   - a profile update (see profile.service), and
 *   - the read path when the cached matches are cold or stale (career.service).
 * Scores are still never hardcoded and never AI-derived, and `job_matches` is still
 * computed (not seeded).
 */

export const RECOMPUTE_JOB = 'career.recompute-user-matches'

/** Loads the real profile signals the engine needs. Ownership is token-derived. */
export async function loadEngineProfile(userId: string): Promise<EngineProfile> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { profile: true, skills: { include: { skill: true } }, languages: { include: { language: true } } },
  })
  if (!user) throw notFound('Profile not found')
  return {
    skills: user.skills.map((us) => ({ name: us.skill.name, level: us.level })),
    languages: user.languages.map((ul) => ({ name: ul.language.name, level: ul.level as LanguageLevel })),
    yearsOfExperience: user.profile?.yearsOfExperience ?? 0,
    addressRegistered: user.profile?.addressRegistered ?? false,
  }
}

/**
 * Recomputes and upserts every active job's match for one user. Idempotent: safe to
 * run from the queue, from the cold-cache bootstrap, or repeatedly.
 */
export async function recomputeUserMatches(userId: string): Promise<void> {
  const profile = await loadEngineProfile(userId)
  const jobs = await prisma.job.findMany({
    where: { status: 'active', deletedAt: null },
    include: jobInclude,
  })
  const computedAt = new Date()
  await prisma.$transaction(
    jobs.map((job) => {
      const m = computeJobMatch(profile, {
        id: job.id,
        skills: job.skills.map((s) => s.skill.name),
        languages: job.languages.map((l) => l.language.name),
      })
      const data = {
        score: m.score,
        confidence: m.confidence,
        skillsScore: m.skillsScore,
        languageScore: m.languageScore,
        reasons: m.reasons,
        computedAt,
      }
      return prisma.jobMatch.upsert({
        where: { userId_jobId: { userId, jobId: job.id } },
        update: data,
        create: { userId, jobId: job.id, ...data },
      })
    }),
  )
}

/**
 * Asks the queue to refresh a user's matches in the background. Duplicate pending
 * refreshes for the same user are coalesced so a burst of edits triggers one run.
 */
export function enqueueRecompute(userId: string): void {
  enqueue(RECOMPUTE_JOB, { userId }, { dedupeKey: `${RECOMPUTE_JOB}:${userId}` })
}

/** Registers the queue handler. Called once at boot before the worker starts. */
export function registerMatchingWorkers(): void {
  registerWorker<{ userId: string }>(RECOMPUTE_JOB, async ({ userId }) => {
    await recomputeUserMatches(userId)
  })
}
