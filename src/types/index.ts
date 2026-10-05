// ============================================================
// PANONAMA OS — core domain types
// These models are designed to be reused when a real backend
// replaces the mock service layer.
// ============================================================

export type UserStatus =
  | 'newcomer'
  | 'tourist_residence'
  | 'student'
  | 'employed'
  | 'business_owner'
  | 'family'

export interface User {
  id: string
  fullName: string
  email: string
  city: string
  country: 'IR' | 'TR'
  createdAt: string
  onboarded: boolean
}

export interface Skill {
  id: string
  name: string          // display name (may be Latin, e.g. "Figma")
  category: SkillCategory
  level: number         // 0-100
}

export type SkillCategory =
  | 'Design'
  | 'Programming'
  | 'Marketing'
  | 'Sales'
  | 'Construction'
  | 'Finance'
  | 'Translation'
  | 'Hospitality'
  | 'Engineering'
  | 'Other'

export type LanguageLevel = 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Beginner'

export interface Language {
  id: string
  name: string          // Persian label, e.g. «فارسی»
  level: LanguageLevel
}

export interface UserProfile {
  userId: string
  status: UserStatus
  daysRemaining: number        // days left on current permit/visa
  residenceProgress: number    // 0-100 toward residence
  citizenshipProgress: number  // 0-100 toward citizenship roadmap
  careerScore: number          // 0-100
  cvScore: number              // 0-100
  profession: string
  yearsOfExperience: number
  skills: Skill[]
  languages: Language[]
  addressRegistered: boolean
  passportExpiry: string       // Persian calendar display string
  insuranceMonthsLeft: number
  rentalContractMonthsLeft: number
  journeyDay: number           // e.g. 27 of 90
}

// ---------------- Documents ----------------

export type DocumentStatus =
  | 'ready'          // آماده
  | 'needs_translation'
  | 'pending'        // در انتظار
  | 'expired'        // منقضی
  | 'needs_review'   // نیازمند بررسی

// Canonical document classification — mirrors @tr-life/shared DocumentType.
export type DocumentType =
  | 'passport'
  | 'residence'
  | 'insurance'
  | 'rental_contract'
  | 'tax'
  | 'education'
  | 'cv'
  | 'other'

export interface Document {
  id: string
  type: DocumentType
  name: string
  icon: string
  status: DocumentStatus
  expiryDate: string | null
  lastUpdated: string
  fileName?: string
  /** True only when the bytes are confirmed in object storage (HTTP mode). */
  hasFile?: boolean
}

// ---------------- Journey ----------------

export type JourneyStepStatus = 'done' | 'in_progress' | 'upcoming' | 'long_term'

export interface JourneyStep {
  id: string
  /** Stable stage key so views can map a step to a UI slot regardless of order. */
  key: string
  day: number
  title: string
  status: JourneyStepStatus
  deadline: string
  checklist: { id: string; label: string; done: boolean }[]
  cta: { label: string; to: string }
}

export interface Journey {
  totalDays: number
  currentDay: number
  steps: JourneyStep[]
  todayTasks: { id: string; label: string; done: boolean }[]
}

export interface NextAction {
  id: string
  order: number
  title: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  cta: { label: string; to: string }
}

// ---------------- Jobs & Opportunities ----------------

export type JobSource =
  | 'LinkedIn'
  | 'Kariyer.net'
  | 'Elemen'
  | 'Partner'
  | 'Community'
  | 'TR Life'

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship'

export interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string                 // e.g. "Remote / Full-time"
  salary: string               // e.g. "₺35,000 – ₺50,000"
  source: JobSource
  sourceUrl: string
  skills: string[]
  languages: string[]
  postedAt: string
  employmentType: EmploymentType
  saved?: boolean
}

export interface JobMatch {
  jobId: string
  matchScore: number      // overall 0-100
  skillsMatch: number
  languageMatch: number
  reasons: string[]
}

/** Truthful integration status of a job source (mirrors @tr-life/shared). */
export interface JobSourceStatus {
  name: JobSource
  adapterKey: string
  enabled: boolean
  health: 'unknown' | 'healthy' | 'degraded' | 'disabled'
  lastSyncAt: string | null
}

export interface CommunityOpportunity {
  id: string
  title: string
  source: string
  channel: string         // Telegram / LinkedIn / ...
  date: string
  category: string
  trustLevel: 'Verified' | 'Community' | 'Unverified'
  url: string
}

// ---------------- Citizenship ----------------

export type CitizenshipGoal =
  | 'investment'
  | 'long_term_residence'
  | 'marriage'
  | 'work'
  | 'business'
  | 'other'

export interface CitizenshipPath {
  id: string
  goal: CitizenshipGoal
  title: string
  summary: string
  minYears: number | null
  steps: string[]
  informational: true
}

// ---------------- Providers / Services ----------------

export type ProviderCategory =
  | 'lawyer'
  | 'translator'
  | 'realestate'
  | 'accountant'
  | 'insurance'
  | 'company_registration'
  | 'education_consultant'

export interface Provider {
  id: string
  name: string            // fictional sample provider
  category: ProviderCategory
  specialty: string
  languages: string[]
  location: string
  trustScore: number      // 0-100
  verified: boolean
  priceRange: string
  sample: true
}

// ---------------- Tickets ----------------

export type TicketStatus = 'open' | 'waiting_response' | 'in_progress' | 'resolved'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string              // human code, e.g. #PN-1042
  subject: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
}

// ---------------- Guides ----------------

export interface Guide {
  id: string
  title: string
  audience: string        // برای چه کسی؟
  whenToAct: string       // زمان اقدام
  documents: string[]     // مدارک
  steps: string[]         // مراحل
  warnings: string[]      // هشدارها
  officialSource: string  // منبع رسمی (placeholder)
  lastUpdated: string
}

// ---------------- Notifications ----------------

export interface Notification {
  id: string
  title: string
  body: string
  type: 'info' | 'warning' | 'success' | 'danger'
  read: boolean
  createdAt: string
}

// ---------------- Housing risk ----------------

export type HousingRiskLevel = 'low' | 'attention' | 'high'

export interface HousingRiskItem {
  id: string
  label: string
  risk: HousingRiskLevel
  note: string
}

// ---------------- Emergency resources (placeholders only) ----------------

export interface EmergencyResource {
  title: string
  note: string
}

export interface EmergencyOption {
  id: string
  label: string
  resources: EmergencyResource[]
}

// ---------------- Career AI panel ----------------

export interface SkillMatchItem {
  skill: string
  match: number      // 0-100
}

/** Stable code for deterministic, profile-derived guidance; localized via i18n. */
export type RecommendationCode =
  | 'turkish_b1'
  | 'english_b2'
  | 'skills_breadth'
  | 'experience'
  | 'address_registration'

export interface AiRecommendation {
  code: RecommendationCode
  done: boolean
}

/** Deterministic career summary (mirrors @tr-life/shared CareerSummaryDTO). */
export interface CareerSummary {
  careerScore: number
  cvScore: number
  skillMatch: SkillMatchItem[]
  recommendations: AiRecommendation[]
}

// ---------------- Dashboard aggregate ----------------

export interface DashboardData {
  user: User
  profile: UserProfile
  nextActions: NextAction[]
  journeySteps: JourneyStep[]
  notifications: Notification[]
  weather: { city: string; tempC: number; dateLabel: string }
}
