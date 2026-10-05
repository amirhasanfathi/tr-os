import { z } from 'zod'

export const updateProfileSchema = z.object({
  profession: z.string().max(120).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  addressRegistered: z.boolean().optional(),
  status: z
    .enum(['newcomer', 'tourist_residence', 'student', 'employed', 'business_owner', 'family'])
    .optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
