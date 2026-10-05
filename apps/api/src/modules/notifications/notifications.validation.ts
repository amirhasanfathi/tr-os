import { z } from 'zod'

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>
