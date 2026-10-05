import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authLimiter } from '../../middleware/rateLimit.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import { loginSchema, refreshSchema, registerSchema } from './auth.validation.js'
import type { LoginInput, RefreshInput, RegisterInput } from './auth.validation.js'
import * as authService from './auth.service.js'

export const authRouter = Router()

authRouter.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body as RegisterInput)
    res.status(201).json(result)
  }),
)

authRouter.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body as LoginInput)
    res.json(result)
  }),
)

authRouter.post(
  '/refresh',
  authLimiter,
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as RefreshInput
    const result = await authService.refresh(refreshToken)
    res.json(result)
  }),
)

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await authService.me(req.user.userId))
  }),
)

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    await authService.logout(req.user.userId)
    res.status(204).send()
  }),
)
