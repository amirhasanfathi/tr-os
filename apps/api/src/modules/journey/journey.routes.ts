import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import { taskIdParamSchema, updateTaskSchema, type UpdateTaskInput } from './journey.validation.js'
import * as journeyService from './journey.service.js'

export const journeyRouter = Router()

// All journey routes are private; the subject is always the authenticated user.
journeyRouter.use(authenticate)

journeyRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await journeyService.getJourney(req.user.userId))
  }),
)

journeyRouter.get(
  '/next-actions',
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await journeyService.getNextActions(req.user.userId))
  }),
)

/** Task completion (checklist items + today's tasks). Mounted at /api/v1/tasks. */
export const tasksRouter = Router()

tasksRouter.use(authenticate)

tasksRouter.patch(
  '/:id',
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    const { completed } = req.body as UpdateTaskInput
    res.json(await journeyService.setTaskCompleted(req.user.userId, req.params.id, completed))
  }),
)
