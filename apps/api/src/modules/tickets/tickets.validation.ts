import { z } from 'zod'

export const ticketIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const listTicketsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(60),
})

// The client provides only content. status/priority are server-assigned and
// ownership is taken from the token — never from the body.
export const createTicketSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(80).optional(),
  body: z.string().trim().min(1).max(4000).optional(),
})

export const addTicketMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
})

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>
