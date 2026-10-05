// Career service — deterministic matching + scoring.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * http — GET /api/v1/career/matches, /api/v1/career/summary. The server owns
//     the single source of truth for scoring; scores are computed, never hardcoded.
//   * mock — a faithful client mirror of the server engine (career.engine.ts) run
//     over the demo profile + demo jobs, so the prototype shows the same numbers
//     the API would. No per-job tuned overrides, no fabricated skill/recommendation
//     data: every value is derived from real profile signals.
//
// The engine functions below MUST stay in lockstep with apps/api career.engine.ts.

import { useHttp } from '../config/runtime'
import { demoProfile } from '../data/mockData'
import { getJobs, toJob, type JobResponseDTO } from './jobService'
import { http } from './httpClient'
import type {
  AiRecommendation,
  CareerSummary,
  Job,
  JobMatch,
  LanguageLevel,
  RecommendationCode,
  SkillMatchItem,
} from '../types'

// ---------------- engine constants (mirror of career.engine.ts) ----------------

const SKILL_BASE = 45
const SKILL_RANGE = 45
const SKILLS_WEIGHT = 0.65
const LANGUAGE_WEIGHT = 0.35
const SCORE_CAP = 85

const LANG_PERSIAN = 'فارسی'
const LANG_ENGLISH = 'انگلیسی'
const LANG_TURKISH = 'ترکی'
const LANG_SCORE_PERSIAN = 90
const LANG_SCORE_ENGLISH = 72
const LANG_SCORE_OTHER = 60

const LEVEL_RANK: Record<LanguageLevel, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Fluent: 4,
  Native: 5,
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n))

interface EngineProfile {
  skills: { name: string; level: number }[]
  languages: { name: string; level: LanguageLevel }[]
  yearsOfExperience: number
  addressRegistered: boolean
}

interface EngineJob {
  id: string
  skills: string[]
  languages: string[]
}

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

function matchedSkills(userSkills: string[], jobSkills: string[]): string[] {
  const owned = userSkills.map(normalize)
  return jobSkills.filter((js) => {
    const n = normalize(js)
    return owned.some((u) => n.includes(u) || u.includes(n))
  })
}

function computeJobMatch(profile: EngineProfile, job: EngineJob): { score: number; skillsScore: number; languageScore: number; reasons: string[] } {
  const userSkillNames = profile.skills.map((s) => s.name)
  const overlap = matchedSkills(userSkillNames, job.skills)
  const skillsScore = Math.round(SKILL_BASE + (overlap.length / Math.max(job.skills.length, 1)) * SKILL_RANGE)
  const languageScore = job.languages.includes(LANG_PERSIAN)
    ? LANG_SCORE_PERSIAN
    : job.languages.includes(LANG_ENGLISH)
      ? LANG_SCORE_ENGLISH
      : LANG_SCORE_OTHER
  const overall = Math.round(skillsScore * SKILLS_WEIGHT + languageScore * LANGUAGE_WEIGHT)
  return { score: Math.min(overall, SCORE_CAP), skillsScore, languageScore, reasons: overlap }
}

function computeCareerScore(profile: EngineProfile): number {
  const skillAvg = profile.skills.length
    ? Math.round(profile.skills.reduce((a, s) => a + s.level, 0) / profile.skills.length)
    : 0
  const experienceBonus = Math.min(profile.yearsOfExperience * 2, 16)
  const turkish = profile.languages.find((l) => l.name === LANG_TURKISH)
  const languagePenalty = turkish ? clamp(16 - LEVEL_RANK[turkish.level] * 2, 0, 14) : 14
  return clamp(Math.round(skillAvg * 0.8 + experienceBonus - languagePenalty), 0, 100)
}

function computeSkillMatch(profile: EngineProfile): SkillMatchItem[] {
  return profile.skills
    .map((s) => ({ skill: s.name, match: clamp(s.level, 0, 100) }))
    .sort((a, b) => b.match - a.match)
}

function rankOf(profile: EngineProfile, name: string): number {
  const l = profile.languages.find((x) => x.name === name)
  return l ? LEVEL_RANK[l.level] : 0
}

function deriveRecommendations(profile: EngineProfile): AiRecommendation[] {
  return [
    { code: 'turkish_b1' as RecommendationCode, done: rankOf(profile, LANG_TURKISH) >= 2 },
    { code: 'english_b2' as RecommendationCode, done: rankOf(profile, LANG_ENGLISH) >= 3 },
    { code: 'skills_breadth' as RecommendationCode, done: profile.skills.length >= 6 },
    { code: 'experience' as RecommendationCode, done: profile.yearsOfExperience >= 5 },
    { code: 'address_registration' as RecommendationCode, done: profile.addressRegistered },
  ]
}

// The demo profile doubles as the engine profile in mock mode.
const mockProfile: EngineProfile = {
  skills: demoProfile.skills.map((s) => ({ name: s.name, level: s.level })),
  languages: demoProfile.languages.map((l) => ({ name: l.name, level: l.level })),
  yearsOfExperience: demoProfile.yearsOfExperience,
  addressRegistered: demoProfile.addressRegistered,
}

// ---------------- HTTP DTOs (mirror @tr-life/shared) ----------------

interface JobMatchDTO {
  jobId: string
  score: number
  skillsScore: number
  languageScore: number
  confidence: number
  reasons: string[]
}

interface MatchedJobDTO {
  job: JobResponseDTO
  match: JobMatchDTO
}

interface CareerSummaryDTO {
  careerScore: number
  cvScore: number
  skillMatch: SkillMatchItem[]
  recommendations: AiRecommendation[]
}

// ---------------- public API ----------------

export interface MatchedJob {
  job: Job
  match: JobMatch
}

/** Jobs ranked by deterministic match score against the current user's profile. */
export async function getMatchedJobs(): Promise<MatchedJob[]> {
  if (useHttp) {
    const res = await http.get<MatchedJobDTO[]>('/career/matches')
    return res.map((m) => ({
      job: toJob(m.job),
      match: {
        jobId: m.match.jobId,
        matchScore: m.match.score,
        skillsMatch: m.match.skillsScore,
        languageMatch: m.match.languageScore,
        reasons: m.match.reasons,
      },
    }))
  }
  const jobs = await getJobs()
  return jobs
    .map((job) => {
      const r = computeJobMatch(mockProfile, { id: job.id, skills: job.skills, languages: job.languages })
      const match: JobMatch = {
        jobId: job.id,
        matchScore: r.score,
        skillsMatch: r.skillsScore,
        languageMatch: r.languageScore,
        reasons: r.reasons,
      }
      return { job, match }
    })
    .sort((a, b) => b.match.matchScore - a.match.matchScore)
}

/** Deterministic career summary (score, cv score, skill bars, recommendations). */
export async function getCareerSummary(): Promise<CareerSummary> {
  if (useHttp) return http.get<CareerSummaryDTO>('/career/summary')
  const careerScore = computeCareerScore(mockProfile)
  return {
    careerScore,
    cvScore: careerScore,
    skillMatch: computeSkillMatch(mockProfile),
    recommendations: deriveRecommendations(mockProfile),
  }
}
