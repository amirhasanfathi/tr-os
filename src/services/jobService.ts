// Job service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo jobs + community opportunities.
//   * http           — GET /api/v1/jobs, POST /api/v1/jobs/:id/save.
//
// Jobs come from the API's stored, sourced rows — never fabricated and never
// scraped here. Display strings (`type`, `salary`, `postedAt`) are derived in
// this mapper from real server values so no presentation rule leaks into React;
// P15 turns `postedAt` into a Jalali label. Match scoring lives in careerService,
// which mirrors the server's deterministic engine (no scores are hardcoded here).
// The shapes below mirror @tr-life/shared.

import { useHttp } from '../config/runtime'
import { demoCommunityOpportunities, demoJobs } from '../data/mockData'
import { formatDate, formatNumber } from '../lib/format'
import { allAdapters } from './adapters/jobSourceAdapter'
import { http } from './httpClient'
import type { CommunityOpportunity, EmploymentType, Job, JobSource, JobSourceStatus } from '../types'

export interface JobResponseDTO {
  id: string
  externalId: string
  title: string
  company: string
  location: string
  remote: boolean
  employmentType: EmploymentType
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  description: string | null
  sourceUrl: string
  source: JobSource
  postedAt: string // ISO
  skills: string[]
  languages: string[]
  saved: boolean
}

interface SaveJobResponseDTO {
  id: string
  saved: boolean
}

const CURRENCY_SYMBOL: Record<string, string> = { TRY: '₺' }

function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  const sym = CURRENCY_SYMBOL[currency ?? ''] ?? currency ?? ''
  if (min == null && max == null) return ''
  if (min != null && max != null) return `${sym}${formatNumber(min)} – ${sym}${formatNumber(max)}`
  return `${sym}${formatNumber((min ?? max) as number)}`
}

// Real ISO timestamp from the API → locale-appropriate date (Jalali in `fa`).
const dateLabel = (iso: string): string => formatDate(iso)

export function toJob(j: JobResponseDTO): Job {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    type: `${j.remote ? 'Remote' : 'On-site'} / ${j.employmentType}`,
    salary: formatSalary(j.salaryMin, j.salaryMax, j.currency),
    source: j.source,
    sourceUrl: j.sourceUrl,
    skills: j.skills,
    languages: j.languages,
    postedAt: dateLabel(j.postedAt),
    employmentType: j.employmentType,
    saved: j.saved,
  }
}

// Mock-mode saved state; the HTTP mode reads/writes SavedJob on the server.
const savedJobIds = new Set<string>(['job-2'])

export async function getJobs(): Promise<Job[]> {
  if (useHttp) {
    const res = await http.get<JobResponseDTO[]>('/jobs')
    return res.map(toJob)
  }
  return demoJobs.map((j) => ({ ...j, saved: savedJobIds.has(j.id) }))
}

export async function getJobsBySource(source: JobSource): Promise<Job[]> {
  if (useHttp) {
    const res = await http.get<JobResponseDTO[]>(`/jobs?source=${encodeURIComponent(source)}`)
    return res.map(toJob)
  }
  const jobs = await getJobs()
  return jobs.filter((j) => j.source === source)
}

/** Toggles the saved state and returns the new value. Ownership is token-derived server-side. */
export async function toggleSaveJob(jobId: string): Promise<boolean> {
  if (useHttp) {
    const res = await http.post<SaveJobResponseDTO>(`/jobs/${jobId}/save`)
    return res.saved
  }
  if (savedJobIds.has(jobId)) {
    savedJobIds.delete(jobId)
    return false
  }
  savedJobIds.add(jobId)
  return true
}

export async function getCommunityOpportunities(): Promise<CommunityOpportunity[]> {
  // Community opportunities are CMS/content data (P13); not part of the jobs API yet.
  return demoCommunityOpportunities
}

/**
 * Truthful job-source integration status. In HTTP mode this reflects the real
 * `job_sources` rows (all `enabled: false` until an authorized adapter is wired);
 * in mock mode it mirrors the prototype adapter list. Never implies a live sync.
 */
export async function getJobSources(): Promise<JobSourceStatus[]> {
  if (useHttp) return http.get<JobSourceStatus[]>('/jobs/sources')
  return allAdapters.map((a) => ({
    name: a.source,
    adapterKey: '',
    enabled: a.enabled,
    health: 'unknown' as const,
    lastSyncAt: null,
  }))
}
