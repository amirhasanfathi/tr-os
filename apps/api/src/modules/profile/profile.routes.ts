import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import { updateProfileSchema, type UpdateProfileInput } from './profile.validation.js'
import * as profileService from './profile.service.js'

export const profileRouter = Router()

// All profile routes are private: the subject is always the authenticated user.
profileRouter.use(authenticate)

profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await profileService.getProfile(req.user.userId))
  }),
)

profileRouter.patch(
  '/',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    const result = await profileService.updateProfile(req.user.userId, req.body as UpdateProfileInput)
    res.json(result)
  }),
)
