import { Router, type Request, type Response } from 'express'
import { Role } from '@tr-life/shared'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import { REQUEST_ID_HEADER, resolveRequestId } from '../../http/requestContext.js'
import {
  listAuditQuerySchema,
  providerIdParamSchema,
  setProviderStatusSchema,
  setProviderVerificationSchema,
  ticketIdParamSchema,
  updateTicketTriageSchema,
  type ListAuditQuery,
  type SetProviderStatusInput,
  type SetProviderVerificationInput,
  type UpdateTicketTriageInput,
} from './admin.validation.js'
import * as adminService from './admin.service.js'
import type { ActorContext } from './admin.service.js'

export const adminRouter = Router()

// The entire admin surface requires an authenticated ADMIN (or SUPER_ADMIN) token.
// Authorization is enforced server-side here; the client hiding the page is cosmetic
// and never trusted.
adminRouter.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN))

/** Builds the actor context purely from the verified token + request, never the body. */
function actorOf(req: Request, res: Response): ActorContext {
  if (!req.user) throw unauthorized()
  // pino-http already echoed a request id on the response; reuse it for the audit row.
  const requestId = (res.getHeader(REQUEST_ID_HEADER) as string | undefined) ?? resolveRequestId(req, res)
  return { actorId: req.user.userId, requestId, ip: req.ip }
}

adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    res.json(await adminService.getStats())
  }),
)

adminRouter.get(
  '/audit',
  validate({ query: listAuditQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await adminService.listAudit(req.query as unknown as ListAuditQuery))
  }),
)

adminRouter.patch(
  '/providers/:id/verification',
  validate({ params: providerIdParamSchema, body: setProviderVerificationSchema }),
  asyncHandler(async (req, res) => {
    await adminService.setProviderVerification(req.params.id, req.body as SetProviderVerificationInput, actorOf(req, res))
    res.sendStatus(204)
  }),
)

adminRouter.patch(
  '/providers/:id/status',
  validate({ params: providerIdParamSchema, body: setProviderStatusSchema }),
  asyncHandler(async (req, res) => {
    await adminService.setProviderStatus(req.params.id, req.body as SetProviderStatusInput, actorOf(req, res))
    res.sendStatus(204)
  }),
)

adminRouter.patch(
  '/tickets/:id/triage',
  validate({ params: ticketIdParamSchema, body: updateTicketTriageSchema }),
  asyncHandler(async (req, res) => {
    await adminService.updateTicketTriage(req.params.id, req.body as UpdateTicketTriageInput, actorOf(req, res))
    res.sendStatus(204)
  }),
)
