import { z } from 'zod'
import { ProviderCategory } from '@tr-life/shared'

const categoryValues = Object.values(ProviderCategory) as [string, ...string[]]

export const providerIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const listProvidersQuerySchema = z.object({
  category: z.enum(categoryValues).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(60),
})

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(1000).optional().nullable(),
})

export type ListProvidersQuery = z.infer<typeof listProvidersQuerySchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
