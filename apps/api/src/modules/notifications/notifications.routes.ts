import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  type ListNotificationsQuery,
} from './notifications.validation.js'
import * as notificationsService from './notifications.service.js'

export const notificationsRouter = Router()

// A user's inbox is private; ownership comes from the token, never from input.
notificationsRouter.use(authenticate)

notificationsRouter.get(
  '/',
  validate({ query: listNotificationsQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await notificationsService.listNotifications(req.user.userId, req.query as unknown as ListNotificationsQuery))
  }),
)

// Static path is declared before the :id route so it is never captured as an id.
notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    await notificationsService.markAllRead(req.user.userId)
    res.status(204).end()
  }),
)

notificationsRouter.post(
  '/:id/read',
  validate({ params: notificationIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    await notificationsService.markRead(req.user.userId, req.params.id)
    res.status(204).end()
  }),
)
