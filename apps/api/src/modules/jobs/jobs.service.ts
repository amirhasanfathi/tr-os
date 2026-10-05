import { Prisma } from '@prisma/client'
import type {
  EmploymentType,
  JobResponse,
  JobSource,
  JobSourceStatusResponse,
  SaveJobResponse,
} from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { conflict, notFound } from '../../http/errors.js'
import { getAdapter } from './adapters/registry.js'
import type { FetchedJob } from './adapters/types.js'
import type { ListJobsQuery } from './jobs.validation.js'

export const jobInclude = {
  source: true,
  skills: { include: { skill: true } },
  languages: { include: { language: true } },
} satisfies Prisma.JobInclude

export type LoadedJob = Prisma.JobGetPayload<{ include: typeof jobInclude }>

export function toJobResponse(job: LoadedJob, saved: boolean): JobResponse {
  return {
    id: job.id,
    externalId: job.externalId,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote,
    employmentType: job.employmentType as EmploymentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    description: job.description,
    sourceUrl: job.sourceUrl,
    source: job.source.name as JobSource,
    postedAt: job.postedAt.toISOString(),
    skills: job.skills.map((s) => s.skill.name),
    languages: job.languages.map((l) => l.language.name),
    saved,
  }
}

/**
 * Lists active jobs visible to the user, with the per-user `saved` flag.
 * Ownership of the saved flag comes from the token (userId), never the client.
 * Match scores are deliberately absent — scoring is the matching engine's job (P9).
 */
export async function listJobs(userId: string, query: ListJobsQuery): Promise<JobResponse[]> {
  const where: Prisma.JobWhereInput = {
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
  }

  const jobs = await prisma.job.findMany({
    where,
    include: jobInclude,
    orderBy: { postedAt: 'desc' },
    take: query.limit,
  })

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId, jobId: { in: jobs.map((j) => j.id) } },
    select: { jobId: true },
  })
  const savedIds = new Set(savedJobs.map((s) => s.jobId))

  return jobs.map((job) => toJobResponse(job, savedIds.has(job.id)))
}

export async function getJob(userId: string, id: string): Promise<JobResponse> {
  const job = await prisma.job.findFirst({
    where: { id, status: 'active', deletedAt: null },
    include: jobInclude,
  })
  if (!job) throw notFound('Job not found')
  const saved = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId: id } } })
  return toJobResponse(job, saved !== null)
}

/** Toggles the saved state; returns the new state. Idempotent per (user, job). */
export async function toggleSaveJob(userId: string, id: string): Promise<SaveJobResponse> {
  const job = await prisma.job.findFirst({ where: { id, status: 'active', deletedAt: null }, select: { id: true } })
  if (!job) throw notFound('Job not found')

  const existing = await prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId: id } } })
  if (existing) {
    await prisma.savedJob.delete({ where: { userId_jobId: { userId, jobId: id } } })
    return { id, saved: false }
  }
  await prisma.savedJob.create({ data: { userId, jobId: id } })
  return { id, saved: true }
}

/** Truthful integration status — `enabled` is false until a real adapter is wired. */
export async function listSources(): Promise<JobSourceStatusResponse[]> {
  const sources = await prisma.jobSource.findMany({ orderBy: { name: 'asc' } })
  return sources.map((s) => ({
    name: s.name as JobSource,
    adapterKey: s.adapterKey,
    enabled: s.enabled,
    health: s.health as JobSourceStatusResponse['health'],
    lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
  }))
}

/**
 * Runs a sync for one source through its registered adapter. Refuses unless BOTH
 * an adapter is registered AND the source row is enabled — so the API can never
 * imply a live integration that does not exist. Admin-only (enforced at the route).
 */
export async function syncSource(adapterKey: string): Promise<{ upserted: number }> {
  const source = await prisma.jobSource.findUnique({ where: { adapterKey } })
  if (!source) throw notFound('Job source not found')

  const adapter = getAdapter(adapterKey)
  if (!adapter || !source.enabled) {
    throw conflict('Job source integration is not available (no adapter registered or source disabled)')
  }

  const fetched: FetchedJob[] = await adapter.fetch()
  let upserted = 0
  for (const f of fetched) {
    await prisma.job.upsert({
      where: { sourceId_externalId: { sourceId: source.id, externalId: f.externalId } },
      update: {
        title: f.title,
        company: f.company,
        location: f.location,
        employmentType: f.employmentType as Prisma.JobUpdateInput['employmentType'],
        remote: f.remote,
        salaryMin: f.salaryMin ?? null,
        salaryMax: f.salaryMax ?? null,
        currency: f.currency ?? null,
        description: f.description ?? null,
        sourceUrl: f.sourceUrl,
        postedAt: f.postedAt,
        status: 'active',
        deletedAt: null,
      },
      create: {
        sourceId: source.id,
        externalId: f.externalId,
        title: f.title,
        company: f.company,
        location: f.location,
        employmentType: f.employmentType as Prisma.JobCreateInput['employmentType'],
        remote: f.remote,
        salaryMin: f.salaryMin ?? null,
        salaryMax: f.salaryMax ?? null,
        currency: f.currency ?? null,
        description: f.description ?? null,
        sourceUrl: f.sourceUrl,
        postedAt: f.postedAt,
        status: 'active',
      },
    })
    upserted++
  }

  await prisma.jobSource.update({
    where: { id: source.id },
    data: { lastSyncAt: new Date(), health: 'healthy' },
  })

  return { upserted }
}
