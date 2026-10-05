import { rateLimit } from 'express-rate-limit'
import type { ApiError } from '@tr-life/shared'
import { env } from '../config/env.js'

function envelope(code: string, message: string, requestId?: unknown): ApiError {
  return { error: { code, message, ...(requestId != null ? { requestId: String(requestId) } : {}) } }
}

/** Stricter limiter for credential endpoints (login/register/refresh/reset). */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Bucket by IP; behind a proxy set `app.set('trust proxy', 1)` in app.ts.
  handler: (req, res) => {
    res.status(429).json(envelope('TOO_MANY_REQUESTS', 'Too many attempts, please try again later.', req.id))
  },
})

/** Baseline limiter applied to the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(envelope('TOO_MANY_REQUESTS', 'Rate limit exceeded.', req.id))
  },
})
