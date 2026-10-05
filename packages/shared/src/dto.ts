// API contract types (DTOs) shared between the web client and the API.
// Dependency-free: plain TypeScript. Validation lives in the API (zod) using
// these shapes as the source of truth for the wire format.

import type { DocumentStatus, DocumentType, EmploymentType, JourneyStepStatus, JobSource, LanguageLevel, NotificationEvent, NotificationType, ProviderCategory, Role, TicketPriority, TicketStatus, UserStatus, VerificationStatus } from './enums.js'

/** Standard error envelope returned by the API for every non-2xx response. */
export interface ApiError {
  error: {
    code: string
    message: string
    /** Field-level validation problems, when applicable. */
    details?: { field: string; message: string }[]
    /** Correlation id echoed from the request, for support/logs. */
    requestId?: string
  }
}

/** Generic cursor/offset page wrapper. */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// ---------------- Auth ----------------

export interface RegisterInput {
  fullName: string
  email: string
  password: string
  city?: string
  country?: 'IR' | 'TR'
}

export interface LoginInput {
  email: string
  password: string
}

/** The only user shape ever sent to the client — never includes the password hash. */
export interface SessionUser {
  id: string
  fullName: string
  email: string
  role: Role
  city: string | null
  country: 'IR' | 'TR'
  onboarded: boolean
  createdAt: string // ISO timestamp
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  /** accessToken lifetime in seconds. */
  expiresIn: number
  tokenType: 'Bearer'
}

export interface AuthResponse {
  user: SessionUser
  tokens: AuthTokens
}

export interface RefreshInput {
  refreshToken: string
}

// ---------------- Profile ----------------

export interface SkillDTO {
  id: string
  name: string
  category: string
  level: number
}

export interface LanguageDTO {
  id: string
  name: string
  level: LanguageLevel
}

/**
 * Canonical profile representation. All dates are ISO timestamptz (never relative
 * strings); the `derived` block carries server-computed indicators so no business
 * rule (days/months remaining, journey day) lives in the client.
 */
export interface ProfileResponse {
  userId: string
  status: UserStatus
  profession: string | null
  yearsOfExperience: number
  addressRegistered: boolean
  skills: SkillDTO[]
  languages: LanguageDTO[]
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
    /** 0-100 progress through the onboarding journey, from completed steps. */
    residenceProgress: number | null
  }
  /** Recomputed server-side; null until the career service has scored it. */
  careerScore: number | null
  citizenshipProgress: number | null
}

/** Fields a user may change about their own profile. Scores/dates are NOT client-set. */
export interface UpdateProfileInput {
  profession?: string
  yearsOfExperience?: number
  addressRegistered?: boolean
  status?: UserStatus
}

// ---------------- Documents ----------------

export interface DocumentResponse {
  id: string
  type: DocumentType
  status: DocumentStatus
  verification: VerificationStatus
  /** Original filename as metadata only — never used to build storage paths. */
  originalFilename: string
  mimeType: string
  sizeBytes: number
  expiresAt: string | null
  uploadedAt: string
  hasFile: boolean
}

/** Request to begin an upload. Server generates the storage key and signed PUT URL. */
export interface InitiateUploadInput {
  type: DocumentType
  originalFilename: string
  mimeType: string
  sizeBytes: number
}

/** Returned by POST /documents/uploads — the client PUTs bytes to `uploadUrl`. */
export interface UploadTicket {
  documentId: string
  uploadUrl: string
  method: 'PUT'
  maxBytes: number
  expiresAt: string
}

/** Returned by GET /documents/:id/download — a short-lived signed GET URL. */
export interface DownloadTicket {
  url: string
  method: 'GET'
  expiresAt: string
}

// ---------------- Journey & Tasks ----------------

/** Navigation target for a journey step / next action. */
export interface CtaDTO {
  label: string
  to: string
}

/** A checklist item within a journey step; `done` is per-user task completion. */
export interface ChecklistItemDTO {
  id: string
  label: string
  done: boolean
}

/**
 * A journey step with the user's progress merged in. Statuses, `dueAt` and
 * `daysUntilDue` are computed server-side from real timestamps — the client never
 * derives them and never receives a pre-formatted relative-date string.
 */
export interface JourneyStepResponse {
  id: string
  /** Stable stage key (e.g. "residence") for mapping to fixed UI slots. */
  key: string
  day: number
  title: string
  status: JourneyStepStatus
  dueAt: string | null
  daysUntilDue: number | null
  checklist: ChecklistItemDTO[]
  cta: CtaDTO
}

export interface TodayTaskDTO {
  id: string
  label: string
  done: boolean
}

export interface JourneyResponse {
  totalDays: number
  /** Elapsed day of the onboarding window, computed from residenceStartedAt. */
  currentDay: number
  steps: JourneyStepResponse[]
  todayTasks: TodayTaskDTO[]
}

export type NextActionPriority = 'high' | 'medium' | 'low'

/** A server-ranked "what to do next" item derived from the user's journey state. */
export interface NextActionResponse {
  id: string
  order: number
  title: string
  priority: NextActionPriority
  dueAt: string | null
  daysUntilDue: number | null
  cta: CtaDTO
}

export interface UpdateTaskInput {
  completed: boolean
}

export interface TaskResponse {
  id: string
  label: string
  done: boolean
  dueAt: string | null
}

// ---------------- Jobs ----------------

/**
 * A job as stored server-side. `postedAt` is an ISO timestamp (never a relative
 * string); display labels are derived by the client from real values. Match
 * scores are NOT part of this DTO — the deterministic matching engine (P9)
 * owns scoring and never hardcodes it here.
 */
export interface JobResponse {
  id: string
  /** Stable per-source identifier; opaque to the client. */
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
  /** Whether the authenticated user has saved this job. */
  saved: boolean
}

export interface SaveJobResponse {
  id: string
  saved: boolean
}

/** Truthful integration status of a job source — never implies a live sync. */
export interface JobSourceStatusResponse {
  name: JobSource
  adapterKey: string
  enabled: boolean
  health: 'unknown' | 'healthy' | 'degraded' | 'disabled'
  lastSyncAt: string | null
}

export interface ListJobsQuery {
  source?: JobSource
  q?: string
  limit?: number
}

// ---------------- Career / deterministic matching ----------------

/**
 * Matching is deterministic business logic computed server-side from the real
 * user profile and job requirements — never AI, and never a hardcoded per-job
 * score. `reasons` carries matched skill names (data); localized display copy is
 * a client concern (P16).
 */
export interface JobMatchDTO {
  jobId: string
  score: number // overall 0-100
  skillsScore: number
  languageScore: number
  confidence: number // 0-1, how much signal backed the score
  reasons: string[]
}

export interface MatchedJobDTO {
  job: JobResponse
  match: JobMatchDTO
}

export interface SkillMatchDTO {
  skill: string
  match: number // 0-100, derived from the user's real proficiency
}

/** Stable codes for deterministic, profile-derived guidance (localized client-side). */
export type RecommendationCode =
  | 'turkish_b1'
  | 'english_b2'
  | 'skills_breadth'
  | 'experience'
  | 'address_registration'

export interface RecommendationDTO {
  code: RecommendationCode
  done: boolean
}

export interface CareerSummaryDTO {
  careerScore: number
  cvScore: number
  skillMatch: SkillMatchDTO[]
  recommendations: RecommendationDTO[]
}

export interface ListMatchesQuery {
  source?: JobSource
  q?: string
  limit?: number
}

// ---------------- Providers (marketplace) ----------------

/**
 * A provider review. Author identity is intentionally omitted from the wire
 * format so no reviewer PII is exposed; only the rating/comment/timestamp ship.
 */
export interface ProviderReviewDTO {
  id: string
  rating: number // 1-5
  comment: string | null
  createdAt: string // ISO
}

/**
 * Public provider card. `trustScore` is a server-computed cache (0-100) derived
 * deterministically from verification + review evidence — never hardcoded and
 * never client-writable. `averageRating` is null until the provider has reviews.
 */
export interface ProviderResponse {
  id: string
  name: string
  category: ProviderCategory
  specialty: string
  location: string
  languages: string[]
  priceMin: number | null
  priceMax: number | null
  currency: string
  trustScore: number
  verified: boolean
  reviewCount: number
  averageRating: number | null
}

export interface ProviderDetailDTO extends ProviderResponse {
  reviews: ProviderReviewDTO[]
}

export interface ListProvidersQuery {
  category?: ProviderCategory
  limit?: number
}

export interface CreateReviewInput {
  rating: number // 1-5
  comment?: string | null
}

// ---------------- Tickets (support) ----------------

export interface TicketMessageDTO {
  id: string
  body: string
  isStaff: boolean
  createdAt: string // ISO
}

export interface TicketSummaryResponse {
  id: string
  code: string // human reference shown in the UI, e.g. #PN-1042
  subject: string
  category: string | null
  status: TicketStatus
  priority: TicketPriority
  createdAt: string // ISO
  updatedAt: string // ISO
}

export interface TicketDetailResponse extends TicketSummaryResponse {
  messages: TicketMessageDTO[]
}

// The client supplies only content; status/priority are server-assigned defaults
// and ownership comes from the token, never from the body.
export interface CreateTicketInput {
  subject: string
  category?: string
  body?: string // optional first message
}

export interface AddTicketMessageInput {
  body: string
}

// ---------------- Notifications ----------------

export interface NotificationResponse {
  id: string
  type: NotificationType
  event: NotificationEvent
  title: string
  body: string
  read: boolean
  createdAt: string // ISO
}

export interface ListNotificationsQuery {
  limit?: number
  unreadOnly?: boolean
}

// ---------------- Admin (dashboard + audit) ----------------

/**
 * Every field here is a real, server-computed aggregate (Prisma count/groupBy).
 * There are no hardcoded numbers: the admin dashboard must never show fabricated
 * statistics, so a value is only ever the result of counting actual rows.
 */
export interface AdminStatsResponse {
  users: number
  jobs: number
  providers: number
  guides: number
  tickets: number
  /** Tickets not yet resolved (open / waiting_response / in_progress). */
  ticketsOpen: number
  /** Providers awaiting a verification decision. */
  providersPendingVerification: number
}

/**
 * An audit trail entry. Deliberately does NOT expose the raw before/after payloads
 * (those can contain sensitive user data) — only the action metadata an operator
 * needs to review who did what, when.
 */
export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  actorId: string | null
  actorName: string | null
  requestId: string | null
  createdAt: string // ISO
}

export interface ListAuditQuery {
  entityType?: string
  limit?: number
  offset?: number
}

// Provider verification is a discrete, auditable admin action.
export interface SetProviderVerificationInput {
  verified: boolean
}

export type ProviderStatusValue = 'pending' | 'active' | 'suspended'

// Lifecycle transition for a provider (e.g. suspend an abusive listing).
export interface SetProviderStatusInput {
  status: ProviderStatusValue
}

// Staff triage of a support ticket. The client may only set status/priority —
// never ownership or the message content of others.
export interface UpdateTicketTriageInput {
  status: TicketStatus
  priority?: TicketPriority
}

// ---------------- Health ----------------

export interface HealthResponse {
  status: 'ok' | 'degraded'
  uptimeSec: number
  timestamp: string // ISO
  version: string
}

export interface ReadinessResponse {
  ready: boolean
  checks: { db: boolean }
}
