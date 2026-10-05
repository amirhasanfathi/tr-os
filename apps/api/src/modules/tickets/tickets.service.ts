import { Prisma, type Ticket, type TicketMessage } from '@prisma/client'
import type {
  AddTicketMessageInput,
  CreateTicketInput,
  TicketDetailResponse,
  TicketMessageDTO,
  TicketSummaryResponse,
} from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'
import type { ListTicketsQuery } from './tickets.validation.js'

/**
 * Support tickets. Every read/write is scoped to the authenticated user's own
 * tickets — ownership is taken from the token, never from input, and a ticket the
 * caller doesn't own is reported as not-found (we never leak existence).
 *
 * The client only supplies content: `status` starts at `open` and `priority` at
 * `medium` server-side (staff/admin triage is a later phase). Message authorship
 * is the token user, so it can't be spoofed.
 */

function toSummary(t: Ticket): TicketSummaryResponse {
  return {
    id: t.id,
    code: t.code,
    subject: t.subject,
    category: t.category,
    status: t.status as TicketSummaryResponse['status'],
    priority: t.priority as TicketSummaryResponse['priority'],
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

function toMessage(m: TicketMessage): TicketMessageDTO {
  return { id: m.id, body: m.body, isStaff: m.isStaff, createdAt: m.createdAt.toISOString() }
}

/** Ownership is always scoped by the authenticated userId — never taken from input. */
async function findOwned(userId: string, id: string): Promise<Ticket> {
  const ticket = await prisma.ticket.findFirst({ where: { id, userId } })
  if (!ticket) throw notFound('Ticket not found')
  return ticket
}

// Human reference shown in the UI. Random short code; the unique constraint is
// enforced by the DB, and createTicket retries on the rare collision.
const randomCode = (): string => `#PN-${Math.floor(1000 + Math.random() * 9000)}`

export async function listTickets(userId: string, query: ListTicketsQuery): Promise<TicketSummaryResponse[]> {
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: query.limit,
  })
  return tickets.map(toSummary)
}

export async function getTicket(userId: string, id: string): Promise<TicketDetailResponse> {
  const ticket = await prisma.ticket.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!ticket) throw notFound('Ticket not found')
  return { ...toSummary(ticket), messages: ticket.messages.map(toMessage) }
}

export async function createTicket(userId: string, input: CreateTicketInput): Promise<TicketSummaryResponse> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const ticket = await tx.ticket.create({
          data: {
            code: randomCode(),
            userId,
            subject: input.subject,
            category: input.category ?? null,
          },
        })
        if (input.body) {
          await tx.ticketMessage.create({
            data: { ticketId: ticket.id, authorId: userId, isStaff: false, body: input.body },
          })
        }
        return ticket
      })
      return toSummary(created)
    } catch (e) {
      // Only retry a code collision; anything else is a real error.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
  }
  throw notFound('Unable to allocate a ticket reference, please retry')
}

export async function addMessage(
  userId: string,
  ticketId: string,
  input: AddTicketMessageInput,
): Promise<TicketMessageDTO> {
  await findOwned(userId, ticketId)
  const message = await prisma.ticketMessage.create({
    data: { ticketId, authorId: userId, isStaff: false, body: input.body },
  })
  // Touch the ticket so its updatedAt (list ordering) reflects the new activity.
  await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } })
  return toMessage(message)
}
