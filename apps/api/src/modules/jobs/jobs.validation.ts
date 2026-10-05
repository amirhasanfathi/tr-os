import { z } from 'zod'
import { JobSource } from '@tr-life/shared'

const sourceValues = Object.values(JobSource) as [string, ...string[]]

export const jobIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const adapterKeyParamSchema = z.object({
  adapterKey: z.string().min(1).max(64),
})

export const listJobsQuerySchema = z.object({
  source: z.enum(sourceValues).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>
