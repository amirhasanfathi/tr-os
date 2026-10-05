/**
 * Typed application errors. Throwing an `HttpError` anywhere in a route/service
 * is caught by the central error handler and serialized to the ApiError envelope.
 */
export class HttpError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: { field: string; message: string }[]

  constructor(
    status: number,
    code: string,
    message: string,
    details?: { field: string; message: string }[],
  ) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (msg = 'Bad request', details?: { field: string; message: string }[]) =>
  new HttpError(400, 'BAD_REQUEST', msg, details)

export const unauthorized = (msg = 'Authentication required') =>
  new HttpError(401, 'UNAUTHORIZED', msg)

export const forbidden = (msg = 'Insufficient permissions') =>
  new HttpError(403, 'FORBIDDEN', msg)

export const notFound = (msg = 'Resource not found') =>
  new HttpError(404, 'NOT_FOUND', msg)

export const conflict = (msg = 'Conflict', details?: { field: string; message: string }[]) =>
  new HttpError(409, 'CONFLICT', msg, details)

export const unprocessable = (msg = 'Validation failed', details?: { field: string; message: string }[]) =>
  new HttpError(422, 'UNPROCESSABLE_ENTITY', msg, details)

export const tooManyRequests = (msg = 'Too many requests') =>
  new HttpError(429, 'TOO_MANY_REQUESTS', msg)

export const internal = (msg = 'Internal server error') =>
  new HttpError(500, 'INTERNAL_ERROR', msg)
