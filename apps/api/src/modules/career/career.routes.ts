import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import { jobIdParamSchema, listMatchesQuerySchema, type ListMatchesQuery } from './career.validation.js'
import * as careerService from './career.service.js'

export const careerRouter = Router()

// All career routes are private; the profile used for scoring is loaded from the
// token's user, never from client input.
careerRouter.use(authenticate)

careerRouter.get(
  '/matches',
  validate({ query: listMatchesQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await careerService.getMatchedJobs(req.user.userId, req.query as unknown as ListMatchesQuery))
  }),
)

careerRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await careerService.getCareerSummary(req.user.userId))
  }),
)

careerRouter.get(
  '/matches/:id',
  validate({ params: jobIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await careerService.getMatch(req.user.userId, req.params.id))
  }),
)
