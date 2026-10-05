import type { AdminStatsResponse, AuditLogEntry, TicketPriority, TicketStatus } from '@tr-life/shared'
import type { AuditLog, Provider } from '@prisma/client'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'
import { writeAudit } from './audit.js'
import { recomputeProviderTrust } from '../providers/providers.service.js'
import type {
  ListAuditQuery,
  SetProviderStatusInput,
  SetProviderVerificationInput,
  UpdateTicketTriageInput,
} from './admin.validation.js'

/**
 * Admin surface. Two guarantees drive every method here:
 *   1. Statistics are COMPUTED, never hardcoded. Each number is a Prisma count over
 *      real rows, so the dashboard can't drift into fabricated statistics.
 *   2. Every privileged mutation writes an audit entry (actor from the token, plus
 *      request id and ip) and takes no ownership/role claims from the client.
 */

/** Who is performing an admin action — always derived from the authenticated token. */
export interface ActorContext {
  actorId: string
  requestId?: string | null
  ip?: string | null
}

// ---------------- stats ----------------

export async function getStats(): Promise<AdminStatsResponse> {
  const [users, jobs, providers, guides, tickets, ticketsOpen, providersPendingVerification] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.job.count({ where: { status: 'active', deletedAt: null } }),
      prisma.provider.count({ where: { deletedAt: null } }),
      prisma.guide.count(),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { not: 'resolved' } } }),
      prisma.provider.count({ where: { deletedAt: null, verified: false } }),
    ])
  return {
    users,
    jobs,
    providers,
    guides,
    tickets,
    ticketsOpen,
    providersPendingVerification,
  }
}

// ---------------- audit trail ----------------

function toAuditEntry(a: AuditLog & { actor: { fullName: string } | null }): AuditLogEntry {
  return {
    id: a.id,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    actorId: a.actorId,
    actorName: a.actor?.fullName ?? null,
    requestId: a.requestId,
    createdAt: a.createdAt.toISOString(),
  }
}

export async function listAudit(query: ListAuditQuery): Promise<AuditLogEntry[]> {
  const where = query.entityType ? { entityType: query.entityType } : {}
  const rows = await prisma.auditLog.findMany({
    where,
    include: { actor: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    skip: query.offset,
  })
  return rows.map(toAuditEntry)
}

// ---------------- provider moderation ----------------

async function findProvider(id: string): Promise<Provider> {
  const provider = await prisma.provider.findFirst({ where: { id, deletedAt: null } })
  if (!provider) throw notFound('Provider not found')
  return provider
}

export async function setProviderVerification(
  id: string,
  input: SetProviderVerificationInput,
  actor: ActorContext,
): Promise<void> {
  const provider = await findProvider(id)
  await prisma.provider.update({
    where: { id },
    data: {
      verified: input.verified,
      verifiedAt: input.verified ? new Date() : null,
      verifiedById: input.verified ? actor.actorId : null,
    },
  })
  // Verification is a signal in the trust score, so recompute the cache.
  await recomputeProviderTrust(id)
  await writeAudit({
    actorId: actor.actorId,
    action: input.verified ? 'provider.verify' : 'provider.unverify',
    entityType: 'provider',
    entityId: id,
    before: { verified: provider.verified },
    after: { verified: input.verified },
    requestId: actor.requestId ?? null,
    ip: actor.ip ?? null,
  })
}

export async function setProviderStatus(
  id: string,
  input: SetProviderStatusInput,
  actor: ActorContext,
): Promise<void> {
  const provider = await findProvider(id)
  await prisma.provider.update({ where: { id }, data: { status: input.status } })
  await writeAudit({
    actorId: actor.actorId,
    action: 'provider.status',
    entityType: 'provider',
    entityId: id,
    before: { status: provider.status },
    after: { status: input.status },
    requestId: actor.requestId ?? null,
    ip: actor.ip ?? null,
  })
}

// ---------------- ticket triage ----------------

export async function updateTicketTriage(
  id: string,
  input: UpdateTicketTriageInput,
  actor: ActorContext,
): Promise<void> {
  const ticket = await prisma.ticket.findFirst({ where: { id } })
  if (!ticket) throw notFound('Ticket not found')

  const data: { status: TicketStatus; priority?: TicketPriority; updatedAt: Date } = {
    status: input.status,
    updatedAt: new Date(),
  }
  if (input.priority) data.priority = input.priority
  await prisma.ticket.update({ where: { id }, data })

  await writeAudit({
    actorId: actor.actorId,
    action: 'ticket.triage',
    entityType: 'ticket',
    entityId: id,
    before: { status: ticket.status, priority: ticket.priority },
    after: { status: input.status, priority: input.priority ?? ticket.priority },
    requestId: actor.requestId ?? null,
    ip: actor.ip ?? null,
  })
}
