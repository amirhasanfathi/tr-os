import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import type { ApiError } from '@tr-life/shared'
import { env } from '../config/env.js'
import { logger } from './logger.js'
import { HttpError, internal } from './errors.js'

/** Serialize any thrown value into the shared ApiError envelope. */
export function toErrorEnvelope(err: unknown, requestId?: unknown): ApiError {
  const http = normalize(err)
  const leakInternal = http.status >= 500 && env.isProduction
  return {
    error: {
      code: http.code,
      message: leakInternal ? 'Internal server error' : http.message,
      ...(http.details ? { details: http.details } : {}),
      ...(requestId != null ? { requestId: String(requestId) } : {}),
    },
  }
}

interface NormalizedError {
  status: number
  code: string
  message: string
  details?: { field: string; message: string }[]
}

function normalize(err: unknown): NormalizedError {
  if (err instanceof HttpError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details }
  }

  if (err instanceof ZodError) {
    return {
      status: 422,
      code: 'UNPROCESSABLE_ENTITY',
      message: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    }
  }

  // Prisma known-request errors (detected via the generated client when available).
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[] | undefined)?.join('.') ?? 'field'
      return { status: 409, code: 'CONFLICT', message: `Unique constraint failed on ${field}` }
    }
    if (err.code === 'P2025') {
      return { status: 404, code: 'NOT_FOUND', message: 'Record not found' }
    }
    if (err.code === 'P2003') {
      return { status: 400, code: 'BAD_REQUEST', message: 'Invalid related resource' }
    }
  }

  if (err instanceof Error && err.name === 'SyntaxError' && 'body' in err) {
    return { status: 400, code: 'BAD_REQUEST', message: 'Malformed JSON body' }
  }

  const fallback = internal()
  return { status: fallback.status, code: fallback.code, message: err instanceof Error ? err.message : fallback.message }
}

/**
 * Central error handler. Must be registered last and keep 4 parameters so
 * Express recognises it as error middleware (`_next` preserves arity).
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const normalized = normalize(err)
  const log = logger.child({ requestId: req.id })

  if (normalized.status >= 500) {
    log.error({ err, path: req.path, method: req.method }, normalized.message)
  } else {
    log.warn({ path: req.path, method: req.method, code: normalized.code }, normalized.message)
  }

  res.status(normalized.status).json(toErrorEnvelope(err, req.id))
}
