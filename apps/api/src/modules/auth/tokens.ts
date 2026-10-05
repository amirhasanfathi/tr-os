import jwt from 'jsonwebtoken'
import type { Role } from '@tr-life/shared'
import { env } from '../../config/env.js'

// Only HS256 is ever issued or accepted. Pinning the algorithm on both sign and
// verify prevents algorithm-confusion (e.g. `alg:none`, or an RS256 public-key-as-
// secret swap) from being smuggled through `jwt.verify`.
const ALGORITHM = 'HS256' as const

export interface TokenPayload {
  /** subject — user id */
  sub: string
  role: Role
  /** user.tokenVersion at issue time; used to revoke refresh tokens on logout */
  ver?: number
}

function sign(payload: TokenPayload, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, { expiresIn, algorithm: ALGORITHM } as jwt.SignOptions)
}

export function signAccessToken(payload: TokenPayload): string {
  return sign(payload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN)
}

export function signRefreshToken(payload: TokenPayload): string {
  return sign(payload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN)
}

function verify(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] }) as Partial<TokenPayload>
  if (!decoded.sub || !decoded.role) {
    throw new jwt.JsonWebTokenError('Malformed token payload')
  }
  return { sub: decoded.sub, role: decoded.role, ver: decoded.ver }
}

export function verifyAccessToken(token: string): TokenPayload {
  return verify(token, env.JWT_ACCESS_SECRET)
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verify(token, env.JWT_REFRESH_SECRET)
}

/** Access-token lifetime in seconds (for the AuthTokens.expiresIn field). */
export function accessTokenTtlSeconds(): number {
  const m = /^(\d+)([smhd])$/.exec(env.JWT_ACCESS_EXPIRES_IN)
  if (!m) return 900
  const n = Number(m[1])
  const mult = m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400
  return n * mult
}
