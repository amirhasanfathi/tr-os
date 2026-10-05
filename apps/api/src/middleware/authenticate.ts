import type { NextFunction, Request, Response } from 'express'
import type { Role } from '@tr-life/shared'
import { unauthorized } from '../http/errors.js'
import { verifyAccessToken } from '../modules/auth/tokens.js'

/** Authenticated principal attached to `req.user`. */
export interface AuthContext {
  userId: string
  role: Role
}

/**
 * Requires a valid `Authorization: Bearer <accessToken>` header.
 * On success sets req.user; otherwise forwards a 401 to the error handler.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(unauthorized('Missing bearer token'))
    return
  }
  const token = header.slice('Bearer '.length).trim()
  try {
    const payload = verifyAccessToken(token)
    req.user = { userId: payload.sub, role: payload.role }
    next()
  } catch {
    next(unauthorized('Invalid or expired token'))
  }
}
