import { Prisma } from '@prisma/client'
import type { LanguageDTO, LanguageLevel, ProfileResponse, SkillDTO, UserStatus } from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'
import { enqueueRecompute } from '../career/matching.worker.js'
import type { UpdateProfileInput } from './profile.validation.js'

const MS_PER_DAY = 86_400_000

const profileInclude = {
  profile: true,
  skills: { include: { skill: true } },
  languages: { include: { language: true } },
} satisfies Prisma.UserInclude

type LoadedUser = Prisma.UserGetPayload<{ include: typeof profileInclude }>

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/**
 * Maps the persisted profile to the wire DTO. Relative indicators (days/months
 * remaining, journey day) are computed HERE from real timestamps — never stored
 * as strings and never delegated to the client.
 */
function toProfileResponse(user: LoadedUser, now: Date, residenceProgress: number | null): ProfileResponse {
  const p = user.profile

  const skills: SkillDTO[] = user.skills.map((us) => ({
    id: us.skill.id,
    name: us.skill.name,
    category: us.skill.category,
    level: us.level,
  }))

  const languages: LanguageDTO[] = user.languages.map((ul) => ({
    id: ul.language.id,
    name: ul.language.name,
    level: ul.level as LanguageLevel,
  }))

  return {
    userId: user.id,
    status: (p?.status ?? 'newcomer') as UserStatus,
    profession: p?.profession ?? null,
    yearsOfExperience: p?.yearsOfExperience ?? 0,
    addressRegistered: p?.addressRegistered ?? false,
    skills,
    languages,
    permitExpiresAt: p?.permitExpiresAt?.toISOString() ?? null,
    passportExpiresAt: p?.passportExpiresAt?.toISOString() ?? null,
    insuranceExpiresAt: p?.insuranceExpiresAt?.toISOString() ?? null,
    rentalContractEndsAt: p?.rentalContractEndsAt?.toISOString() ?? null,
    residenceStartedAt: p?.residenceStartedAt?.toISOString() ?? null,
    derived: {
      permitDaysRemaining: p?.permitExpiresAt ? daysBetween(now, p.permitExpiresAt) : null,
      insuranceMonthsRemaining: p?.insuranceExpiresAt ? Math.round(daysBetween(now, p.insuranceExpiresAt) / 30) : null,
      rentalContractMonthsRemaining: p?.rentalContractEndsAt ? Math.round(daysBetween(now, p.rentalContractEndsAt) / 30) : null,
      journeyDay: p?.residenceStartedAt ? Math.max(1, daysBetween(p.residenceStartedAt, now)) : null,
      residenceProgress,
    },
    careerScore: p?.careerScoreCache ?? null,
    citizenshipProgress: p?.citizenshipProgressCache ?? null,
  }
}

export async function getProfile(userId: string): Promise<ProfileResponse> {
  const [user, doneSteps, totalSteps] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: profileInclude,
    }),
    prisma.userJourneyStep.count({ where: { userId, status: 'done' } }),
    prisma.userJourneyStep.count({ where: { userId } }),
  ])
  if (!user) throw notFound('Profile not found')
  // Progress toward residence = share of onboarding journey steps completed.
  const residenceProgress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : null
  return toProfileResponse(user, new Date(), residenceProgress)
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
  // Ownership comes from the authenticated token (userId), never from the body.
  // Scores and expiry dates are deliberately NOT client-writable.
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      profession: input.profession,
      yearsOfExperience: input.yearsOfExperience,
      addressRegistered: input.addressRegistered,
      status: input.status as Prisma.UserProfileUpdateInput['status'],
    },
    create: {
      userId,
      profession: input.profession,
      yearsOfExperience: input.yearsOfExperience ?? 0,
      addressRegistered: input.addressRegistered ?? false,
      status: (input.status ?? 'newcomer') as Prisma.UserProfileCreateInput['status'],
    },
  })
  // Experience/address changes feed the deterministic match + career score, so ask
  // the queue to refresh this user's cached matches in the background (P10).
  enqueueRecompute(userId)
  return getProfile(userId)
}
