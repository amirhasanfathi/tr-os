import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import {
  createReviewSchema,
  listProvidersQuerySchema,
  providerIdParamSchema,
  type CreateReviewInput,
  type ListProvidersQuery,
} from './providers.validation.js'
import * as providersService from './providers.service.js'

export const providersRouter = Router()

// The marketplace is browsable by any authenticated user. Review authorship is
// taken from the token; provider verification/status changes belong to the admin
// module (a later phase) and are deliberately not exposed here.
providersRouter.use(authenticate)

providersRouter.get(
  '/',
  validate({ query: listProvidersQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await providersService.listProviders(req.query as unknown as ListProvidersQuery))
  }),
)

providersRouter.get(
  '/:id',
  validate({ params: providerIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await providersService.getProvider(req.params.id))
  }),
)

providersRouter.get(
  '/:id/reviews',
  validate({ params: providerIdParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await providersService.listReviews(req.params.id))
  }),
)

providersRouter.post(
  '/:id/reviews',
  validate({ params: providerIdParamSchema, body: createReviewSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    const review = await providersService.createReview(
      req.user.userId,
      req.params.id,
      req.body as CreateReviewInput,
    )
    res.status(201).json(review)
  }),
)
