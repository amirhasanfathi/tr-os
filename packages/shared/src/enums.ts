// Canonical enums shared by the web client and the API.
// These mirror the Prisma schema enums in apps/api/prisma/schema.prisma.

export const Role = {
  USER: 'USER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const
export type Role = (typeof Role)[keyof typeof Role]

export const UserStatus = {
  NEWCOMER: 'newcomer',
  TOURIST_RESIDENCE: 'tourist_residence',
  STUDENT: 'student',
  EMPLOYED: 'employed',
  BUSINESS_OWNER: 'business_owner',
  FAMILY: 'family',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const LanguageLevel = {
  NATIVE: 'Native',
  FLUENT: 'Fluent',
  ADVANCED: 'Advanced',
  INTERMEDIATE: 'Intermediate',
  BEGINNER: 'Beginner',
} as const
export type LanguageLevel = (typeof LanguageLevel)[keyof typeof LanguageLevel]

export const DocumentStatus = {
  READY: 'ready',
  NEEDS_TRANSLATION: 'needs_translation',
  PENDING: 'pending',
  EXPIRED: 'expired',
  NEEDS_REVIEW: 'needs_review',
} as const
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus]

export const DocumentType = {
  PASSPORT: 'passport',
  RESIDENCE: 'residence',
  INSURANCE: 'insurance',
  RENTAL_CONTRACT: 'rental_contract',
  TAX: 'tax',
  EDUCATION: 'education',
  CV: 'cv',
  OTHER: 'other',
} as const
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType]

export const VerificationStatus = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]

export const JourneyStepStatus = {
  DONE: 'done',
  IN_PROGRESS: 'in_progress',
  UPCOMING: 'upcoming',
  LONG_TERM: 'long_term',
} as const
export type JourneyStepStatus = (typeof JourneyStepStatus)[keyof typeof JourneyStepStatus]

export const JobSource = {
  LINKEDIN: 'LinkedIn',
  KARIYER: 'Kariyer.net',
  ELEMEN: 'Elemen',
  PARTNER: 'Partner',
  COMMUNITY: 'Community',
  TR_LIFE: 'TR Life',
} as const
export type JobSource = (typeof JobSource)[keyof typeof JobSource]

export const EmploymentType = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
} as const
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType]

export const ProviderCategory = {
  LAWYER: 'lawyer',
  TRANSLATOR: 'translator',
  REALESTATE: 'realestate',
  ACCOUNTANT: 'accountant',
  INSURANCE: 'insurance',
  COMPANY_REGISTRATION: 'company_registration',
  EDUCATION_CONSULTANT: 'education_consultant',
} as const
export type ProviderCategory = (typeof ProviderCategory)[keyof typeof ProviderCategory]

export const TicketStatus = {
  OPEN: 'open',
  WAITING_RESPONSE: 'waiting_response',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority]

export const NotificationType = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  DANGER: 'danger',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const NotificationEvent = {
  DOCUMENT_EXPIRING: 'DOCUMENT_EXPIRING',
  APPLICATION_STATUS_CHANGED: 'APPLICATION_STATUS_CHANGED',
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  TICKET_REPLIED: 'TICKET_REPLIED',
  JOB_MATCHED: 'JOB_MATCHED',
} as const
export type NotificationEvent = (typeof NotificationEvent)[keyof typeof NotificationEvent]

export const CitizenshipGoal = {
  INVESTMENT: 'investment',
  LONG_TERM_RESIDENCE: 'long_term_residence',
  MARRIAGE: 'marriage',
  WORK: 'work',
  BUSINESS: 'business',
  OTHER: 'other',
} as const
export type CitizenshipGoal = (typeof CitizenshipGoal)[keyof typeof CitizenshipGoal]

export const TrustLevel = {
  VERIFIED: 'Verified',
  COMMUNITY: 'Community',
  UNVERIFIED: 'Unverified',
} as const
export type TrustLevel = (typeof TrustLevel)[keyof typeof TrustLevel]
