// Integration-ready adapter architecture for future job sources.
// No scraping is implemented — adapters return normalized mock data.

import type { Job, JobSource } from '../../types'

export interface JobSourceAdapter {
  source: JobSource
  /** Future: fetch from real API. Prototype: returns mock jobs tagged with this source. */
  fetchJobs(): Promise<Job[]>
  enabled: boolean
}

class MockSourceAdapter implements JobSourceAdapter {
  enabled = false // flip to true when a real integration is wired
  constructor(public source: JobSource, private jobs: Job[]) {}
  async fetchJobs(): Promise<Job[]> {
    return this.jobs.filter((j) => j.source === this.source)
  }
}

import { demoJobs } from '../../data/mockData'

export const LinkedInAdapter: JobSourceAdapter = new MockSourceAdapter('LinkedIn', demoJobs)
export const KariyerAdapter: JobSourceAdapter = new MockSourceAdapter('Kariyer.net', demoJobs)
export const ElemanAdapter: JobSourceAdapter = new MockSourceAdapter('Elemen', demoJobs)
export const CommunityAdapter: JobSourceAdapter = new MockSourceAdapter('Community', demoJobs)
export const PartnerAdapter: JobSourceAdapter = new MockSourceAdapter('Partner', demoJobs)
export const TrLifeAdapter: JobSourceAdapter = new MockSourceAdapter('TR Life', demoJobs)

export const allAdapters: JobSourceAdapter[] = [
  LinkedInAdapter,
  KariyerAdapter,
  ElemanAdapter,
  CommunityAdapter,
  PartnerAdapter,
  TrLifeAdapter,
]
