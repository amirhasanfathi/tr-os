import type { EmploymentType } from '@tr-life/shared'

/**
 * A job normalized from an external source. Adapters return this shape; the
 * jobs service persists it. Nothing here implies how the data was obtained —
 * each adapter is responsible for being an authorized, terms-compliant
 * integration. Scraping is not permitted and no source is fabricated.
 */
export interface FetchedJob {
  externalId: string
  title: string
  company: string
  location: string
  employmentType: EmploymentType
  remote: boolean
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: string | null
  description?: string | null
  sourceUrl: string
  postedAt: Date
  skills?: string[]
  languages?: string[]
}

/**
 * The seam a real, authorized job integration plugs into. `key` must match a
 * `JobSource.adapterKey` row, and that row must be `enabled` before a sync runs
 * (see jobs.service.syncSource). No adapter is registered yet on purpose.
 */
export interface JobSourceAdapter {
  readonly key: string
  readonly sourceName: string
  fetch(): Promise<FetchedJob[]>
}
