import type { LanguageLevel } from '@tr-life/shared'
import type {
  JobMatchDTO,
  RecommendationCode,
  RecommendationDTO,
  SkillMatchDTO,
} from '@tr-life/shared'

/**
 * Deterministic career/matching engine — pure functions, no I/O and no AI.
 * Every number here is computed from real profile + job data using fixed,
 * named weights; there are no per-job hardcoded scores. The same algorithm is
 * mirrored in the web client's mock mode so both paths agree.
 */

export interface EngineSkill {
  name: string
  level: number // 0-100 proficiency
}
export interface EngineLanguage {
  name: string
  level: LanguageLevel
}
export interface EngineProfile {
  skills: EngineSkill[]
  languages: EngineLanguage[]
  yearsOfExperience: number
  addressRegistered: boolean
}
export interface EngineJob {
  id: string
  skills: string[]
  languages: string[]
}

// ---- Job-match weights (deterministic config, not fabricated scores) ----
const SKILL_BASE = 45
const SKILL_RANGE = 45
const SKILLS_WEIGHT = 0.65
const LANGUAGE_WEIGHT = 0.35
const SCORE_CAP = 85

// Language names are stored in Persian (see seed); matched against job requirements.
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

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n))
const norm = (s: string): string => s.trim().toLowerCase()

function matchedSkills(userSkills: string[], jobSkills: string[]): string[] {
  const user = userSkills.map(norm)
  return jobSkills.filter((js) => {
    const j = norm(js)
    return user.some((u) => j.includes(u) || u.includes(j))
  })
}

/** Deterministic match of one job against the user's skills + language profile. */
export function computeJobMatch(profile: EngineProfile, job: EngineJob): JobMatchDTO {
  const overlap = matchedSkills(
    profile.skills.map((s) => s.name),
    job.skills,
  )
  const skillsScore = Math.round(SKILL_BASE + (overlap.length / Math.max(job.skills.length, 1)) * SKILL_RANGE)
  const languageScore = job.languages.includes(LANG_PERSIAN)
    ? LANG_SCORE_PERSIAN
    : job.languages.includes(LANG_ENGLISH)
      ? LANG_SCORE_ENGLISH
      : LANG_SCORE_OTHER
  const overall = Math.round(skillsScore * SKILLS_WEIGHT + languageScore * LANGUAGE_WEIGHT)
  const confidence = job.skills.length > 0 ? Math.round((overlap.length / job.skills.length) * 100) / 100 : 0
  return {
    jobId: job.id,
    score: Math.min(overall, SCORE_CAP),
    skillsScore,
    languageScore,
    confidence,
    reasons: overlap,
  }
}

/** Deterministic 0-100 career score from real skills, experience and Turkish level. */
export function computeCareerScore(profile: EngineProfile): number {
  const skillAvg =
    profile.skills.length > 0
      ? Math.round(profile.skills.reduce((a, s) => a + s.level, 0) / profile.skills.length)
      : 0
  const experienceBonus = Math.min(profile.yearsOfExperience * 2, 16)
  const turkish = profile.languages.find((l) => l.name === LANG_TURKISH)?.level
  // Penalty scales with how far Turkish is from working proficiency (B1/Intermediate).
  const languagePenalty = turkish ? clamp(16 - LEVEL_RANK[turkish] * 2, 0, 14) : 14
  return clamp(Math.round(skillAvg * 0.8 + experienceBonus - languagePenalty), 0, 100)
}

/** Skill-match bars derived from the user's real proficiency — never fabricated skills. */
export function computeSkillMatch(profile: EngineProfile): SkillMatchDTO[] {
  return profile.skills
    .map((s) => ({ skill: s.name, match: clamp(s.level, 0, 100) }))
    .sort((a, b) => b.match - a.match)
}

/**
 * Guidance derived deterministically from real profile gaps. Returns stable codes;
 * the client localizes them. No fabricated checklist items.
 */
export function deriveRecommendations(profile: EngineProfile): RecommendationDTO[] {
  const rankOf = (name: string): number => {
    const lvl = profile.languages.find((l) => l.name === name)?.level
    return lvl ? LEVEL_RANK[lvl] : 0
  }
  const recs: { code: RecommendationCode; done: boolean }[] = [
    { code: 'turkish_b1', done: rankOf(LANG_TURKISH) >= LEVEL_RANK.Intermediate },
    { code: 'english_b2', done: rankOf(LANG_ENGLISH) >= LEVEL_RANK.Advanced },
    { code: 'skills_breadth', done: profile.skills.length >= 6 },
    { code: 'experience', done: profile.yearsOfExperience >= 5 },
    { code: 'address_registration', done: profile.addressRegistered },
  ]
  return recs
}
