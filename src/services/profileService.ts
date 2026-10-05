// Profile service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo profile.
//   * http           — GET/PATCH /api/v1/profile.
//
// Profile and journey endpoints are wired to HTTP; `getUser` and the dashboard
// `notifications`/`weather` blocks stay on mock until their backing modules land
// (auth-me aggregation, notifications P11, external weather) — flipping them now
// would call endpoints that don't exist yet.
//
// The ProfileResponse shape below mirrors @tr-life/shared (packages/shared/src/dto.ts),
// duplicated only because the web app is not yet part of the npm workspace.

import { useHttp } from '../config/runtime'
import { demoProfile, demoUser } from '../data/mockData'
import { formatDate } from '../lib/format'
import { http } from './httpClient'
import type { DashboardData, SkillCategory, User, UserProfile } from '../types'
import { getNextActions, getUserJourney } from './journeyService'
import { getNotifications } from './notificationService'

type LanguageLevel = UserProfile['languages'][number]['level']
type UserStatus = UserProfile['status']

interface ProfileResponseDTO {
  userId: string
  status: UserStatus
  profession: string | null
  yearsOfExperience: number
  addressRegistered: boolean
  skills: { id: string; name: string; category: string; level: number }[]
  languages: { id: string; name: string; level: LanguageLevel }[]
  permitExpiresAt: string | null
  passportExpiresAt: string | null
  insuranceExpiresAt: string | null
  rentalContractEndsAt: string | null
  residenceStartedAt: string | null
  derived: {
    permitDaysRemaining: number | null
    insuranceMonthsRemaining: number | null
    rentalContractMonthsRemaining: number | null
    journeyDay: number | null
    residenceProgress: number | null
  }
  careerScore: number | null
  citizenshipProgress: number | null
}

// Display labels for the canonical status enum live in the i18n layer
// (`statuses.*`); the service only carries the enum value, never a translated string.

function toUserProfile(p: ProfileResponseDTO): UserProfile {
  return {
    userId: p.userId,
    status: p.status,
    daysRemaining: p.derived.permitDaysRemaining ?? 0,
    // Residence progress is computed server-side by the journey module from real
    // step statuses (done/total) — never derived or hardcoded on the client.
    residenceProgress: p.derived.residenceProgress ?? 0,
    citizenshipProgress: p.citizenshipProgress ?? 0,
    careerScore: p.careerScore ?? 0,
    cvScore: p.careerScore ?? 0,
    profession: p.profession ?? '',
    yearsOfExperience: p.yearsOfExperience,
    skills: p.skills.map((s) => ({ id: s.id, name: s.name, category: s.category as SkillCategory, level: s.level })),
    languages: p.languages.map((l) => ({ id: l.id, name: l.name, level: l.level })),
    addressRegistered: p.addressRegistered,
    // The API returns an ISO timestamp; shown as a Jalali date in the Persian UI.
    passportExpiry: formatDate(p.passportExpiresAt),
    insuranceMonthsLeft: p.derived.insuranceMonthsRemaining ?? 0,
    rentalContractMonthsLeft: p.derived.rentalContractMonthsRemaining ?? 0,
    journeyDay: p.derived.journeyDay ?? 0,
  }
}

let profile: UserProfile = { ...demoProfile }
const user: User = { ...demoUser }

export async function getUserProfile(): Promise<UserProfile> {
  if (useHttp) {
    const res = await http.get<ProfileResponseDTO>('/profile')
    profile = toUserProfile(res)
    return profile
  }
  return profile
}

export async function getUser(): Promise<User> {
  return user
}

export async function updateUserProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  if (useHttp) {
    // Only user-writable fields are sent; scores/dates are server-owned.
    const res = await http.patch<ProfileResponseDTO>('/profile', {
      profession: patch.profession,
      yearsOfExperience: patch.yearsOfExperience,
      addressRegistered: patch.addressRegistered,
      status: patch.status,
    })
    profile = toUserProfile(res)
    return profile
  }
  profile = { ...profile, ...patch }
  return profile
}

export async function getDashboardData(): Promise<DashboardData> {
  const journey = await getUserJourney()
  return {
    user,
    profile,
    nextActions: await getNextActions(),
    journeySteps: journey.steps,
    notifications: await getNotifications(),
    weather: { city: 'Istanbul', tempC: 18, dateLabel: 'Tuesday, 27 October 2026' },
  }
}
