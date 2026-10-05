import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../http/asyncHandler.js'
import { unauthorized } from '../../http/errors.js'
import {
  addTicketMessageSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamSchema,
  type CreateTicketInput,
  type ListTicketsQuery,
} from './tickets.validation.js'
import * as ticketsService from './tickets.service.js'

export const ticketsRouter = Router()

// Support tickets are strictly private: every handler derives the owner from the
// token. A user can only ever see and act on their own tickets.
ticketsRouter.use(authenticate)

ticketsRouter.get(
  '/',
  validate({ query: listTicketsQuerySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await ticketsService.listTickets(req.user.userId, req.query as unknown as ListTicketsQuery))
  }),
)

ticketsRouter.post(
  '/',
  validate({ body: createTicketSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    const ticket = await ticketsService.createTicket(req.user.userId, req.body as CreateTicketInput)
    res.status(201).json(ticket)
  }),
)

ticketsRouter.get(
  '/:id',
  validate({ params: ticketIdParamSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    res.json(await ticketsService.getTicket(req.user.userId, req.params.id))
  }),
)

ticketsRouter.post(
  '/:id/messages',
  validate({ params: ticketIdParamSchema, body: addTicketMessageSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized()
    const message = await ticketsService.addMessage(req.user.userId, req.params.id, req.body)
    res.status(201).json(message)
  }),
)
