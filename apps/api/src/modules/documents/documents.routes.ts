import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import {
  documentIdParamSchema,
  initiateUploadSchema,
  type InitiateUploadInput,
} from './documents.validation.js'
import * as documentsService from './documents.service.js'

export const documentsRouter = Router()

// All document routes are private; ownership is derived from the token, never input.
documentsRouter.use(authenticate)

documentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await documentsService.listDocuments(req.user.userId))
  }),
)

// Step 1: create metadata + return a signed PUT URL for the actual bytes.
documentsRouter.post(
  '/uploads',
  validate({ body: initiateUploadSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    const ticket = await documentsService.initiateUpload(req.user.userId, req.body as InitiateUploadInput)
    res.status(201).json(ticket)
  }),
)

documentsRouter.get(
  '/:id',
  validate({ params: documentIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await documentsService.getDocument(req.user.userId, req.params.id))
  }),
)

// Step 2: confirm the bytes landed in storage and mark the document ready.
documentsRouter.post(
  '/:id/complete',
  validate({ params: documentIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await documentsService.completeUpload(req.user.userId, req.params.id))
  }),
)

// Returns a short-lived signed GET URL; the file itself is never proxied here.
documentsRouter.get(
  '/:id/download',
  validate({ params: documentIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await documentsService.getDownloadUrl(req.user.userId, req.params.id))
  }),
)

documentsRouter.delete(
  '/:id',
  validate({ params: documentIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    await documentsService.deleteDocument(req.user.userId, req.params.id)
    res.status(204).end()
  }),
)
