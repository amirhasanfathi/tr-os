import type { Request, Response } from 'express'
import { notFound as notFoundError } from './errors.js'
import { toErrorEnvelope } from './errorHandler.js'

/** Terminal handler for unmatched routes → 404 with the standard envelope. */
export function notFoundHandler(req: Request, res: Response): void {
  const err = notFoundError(`Route ${req.method} ${req.path} not found`)
  res.status(err.status).json(toErrorEnvelope(err, req.id))
}
