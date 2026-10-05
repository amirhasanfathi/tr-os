import { z } from 'zod'
import { TicketPriority, TicketStatus } from '@tr-life/shared'

const statusValues = Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]]
const priorityValues = Object.values(TicketPriority) as [TicketPriority, ...TicketPriority[]]

export const providerIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const ticketIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const listAuditQuerySchema = z.object({
  entityType: z.string().trim().min(1).max(60).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
})

export const setProviderVerificationSchema = z.object({
  verified: z.boolean(),
})

export const setProviderStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended']),
})

export const updateTicketTriageSchema = z.object({
  status: z.enum(statusValues),
  priority: z.enum(priorityValues).optional(),
})

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>
export type SetProviderVerificationInput = z.infer<typeof setProviderVerificationSchema>
export type SetProviderStatusInput = z.infer<typeof setProviderStatusSchema>
export type UpdateTicketTriageInput = z.infer<typeof updateTicketTriageSchema>
