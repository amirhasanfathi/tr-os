import { Router } from 'express'
import { Role } from '@tr-life/shared'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import {
  adapterKeyParamSchema,
  jobIdParamSchema,
  listJobsQuerySchema,
  type ListJobsQuery,
} from './jobs.validation.js'
import * as jobsService from './jobs.service.js'

export const jobsRouter = Router()

// All job routes are private; the saved flag and sync authorization are derived
// from the token, never from client input.
jobsRouter.use(authenticate)

jobsRouter.get(
  '/',
  validate({ query: listJobsQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await jobsService.listJobs(req.user.userId, req.query as unknown as ListJobsQuery))
  }),
)

// Truthful integration status (registered before /:id so it is not treated as an id).
jobsRouter.get(
  '/sources',
  asyncHandler(async (_req, res) => {
    res.json(await jobsService.listSources())
  }),
)

// Admin-only sync through the adapter seam; refuses unless an adapter is
// registered and the source is enabled.
jobsRouter.post(
  '/sources/:adapterKey/sync',
  authorize(Role.ADMIN),
  validate({ params: adapterKeyParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await jobsService.syncSource(req.params.adapterKey))
  }),
)

jobsRouter.get(
  '/:id',
  validate({ params: jobIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await jobsService.getJob(req.user.userId, req.params.id))
  }),
)

jobsRouter.post(
  '/:id/save',
  validate({ params: jobIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await jobsService.toggleSaveJob(req.user.userId, req.params.id))
  }),
)
