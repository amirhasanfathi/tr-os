// Admin service — dashboard aggregates + audit trail.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — every number is DERIVED from the actual demo datasets
//     (array lengths / status counts). Nothing is hardcoded. Where a real count
//     has no backing demo collection (e.g. total users), we return null and the UI
//     shows «—» rather than inventing a statistic.
//   * http           — GET /api/v1/admin/stats and GET /api/v1/admin/audit, where
//     every figure is a server-side Prisma aggregate.
//
// The client never computes or sends authorization; the API gates these routes on
// an ADMIN token. Shapes mirror @tr-life/shared.

import { useHttp } from '../config/runtime'
import { demoGuides, demoJobs, demoProviders, demoTickets } from '../data/mockData'
import { http } from './httpClient'

export interface AdminStats {
  users: number | null
  jobs: number
  providers: number
  guides: number
  tickets: number
  ticketsOpen: number
  providersPendingVerification: number
}

interface AdminStatsDTO extends Omit<AdminStats, 'users'> {
  users: number
}

export interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  actorId: string | null
  actorName: string | null
  requestId: string | null
  createdAt: string // ISO — formatted at the UI edge (P15 util), never here
}

// ---------------- mock (derived from real demo data) ----------------

function mockStats(): AdminStats {
  return {
    // No demo collection models the full user base, so we don't fabricate a total.
    users: null,
    jobs: demoJobs.length,
    providers: demoProviders.length,
    guides: demoGuides.length,
    tickets: demoTickets.length,
    ticketsOpen: demoTickets.filter((t) => t.status !== 'resolved').length,
    providersPendingVerification: demoProviders.filter((p) => !p.verified).length,
  }
}

// ---------------- http ----------------

async function fetchStats(): Promise<AdminStats> {
  const dto = await http.get<AdminStatsDTO>('/admin/stats')
  return { ...dto, users: dto.users }
}

export async function getAdminStats(): Promise<AdminStats> {
  if (useHttp) return fetchStats()
  return mockStats()
}

export async function getAuditTrail(entityType?: string): Promise<AuditEntry[]> {
  if (!useHttp) return [] // The audit trail is a server concern; mock mode has none.
  const qs = entityType ? `?entityType=${encodeURIComponent(entityType)}` : ''
  const rows = await http.get<AuditEntry[]>(`/admin/audit${qs}`)
  return rows
}
