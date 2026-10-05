import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodTypeAny } from 'zod'
import { unprocessable } from '../http/errors.js'

interface Schemas {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

/**
 * Validates and replaces req.body / req.query / req.params with the parsed
 * (and therefore correctly typed + defaulted) output. On failure throws a 422
 * with field-level details; the central error handler serialises it.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const details: { field: string; message: string }[] = []

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key]
      if (!schema) continue
      const result = schema.safeParse(req[key])
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({ field: `${key}.${issue.path.join('.') || '(root)'}`, message: issue.message })
        }
        continue
      }
      // Express 5 types query as read-only; cast is safe here (we own the object).
      ;(req as unknown as Record<string, unknown>)[key] = result.data
    }

    if (details.length > 0) {
      next(unprocessable('Validation failed', details))
      return
    }
    next()
  }
}
