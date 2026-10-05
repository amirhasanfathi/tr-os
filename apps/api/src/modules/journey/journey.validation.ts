import { z } from 'zod'

export const taskIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const updateTaskSchema = z.object({
  completed: z.boolean(),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
