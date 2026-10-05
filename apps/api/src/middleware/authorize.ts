import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Role } from '@tr-life/shared'
import { forbidden, unauthorized } from '../http/errors.js'

/**
 * Role gate. MUST run after `authenticate`. Authorization is enforced here on
 * the server — never rely on the client hiding UI.
 */
export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(unauthorized())
      return
    }
    if (!roles.includes(req.user.role)) {
      next(forbidden('You do not have access to this resource'))
      return
    }
    next()
  }
}
