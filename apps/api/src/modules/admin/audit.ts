import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma.js'

/**
 * Single source of truth for writing the audit trail. Admin mutations call this so
 * every privileged action is recorded the same way (actor from the token, request id
 * and ip from the request) — never from anything the client claims about itself.
 */
export interface AuditInput {
  actorId: string
  action: string
  entityType: string
  entityId?: string | null
  before?: Prisma.InputJsonValue | null
  after?: Prisma.InputJsonValue | null
  requestId?: string | null
  ip?: string | null
}

export async function writeAudit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
      requestId: input.requestId ?? null,
      ip: input.ip ?? null,
    },
  })
}
