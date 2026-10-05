import { z } from 'zod'

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt input limit

export const registerSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email().toLowerCase(),
  password,
  city: z.string().max(80).optional(),
  country: z.enum(['IR', 'TR']).optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
