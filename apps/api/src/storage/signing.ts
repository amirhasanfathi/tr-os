import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'

/**
 * HMAC-SHA256 signing for local storage URLs.
 *
 * This is the "signed URL or equivalent secure access mechanism": a URL carries
 * `exp` (unix seconds) + `sig` (base64url HMAC over `<payload>.<exp>`). Access is
 * granted only if the signature matches and the expiry is in the future. The
 * payload always includes the operation ("get"/"put") so a download signature
 * can never be replayed as an upload.
 */

function hmac(payload: string): string {
  return createHmac('sha256', env.STORAGE_SIGNING_KEY).update(payload).digest('base64url')
}

export interface SignedParts {
  exp: number
  sig: string
}

export function createSignature(payload: string, ttlSeconds: number): SignedParts {
  const exp = Math.ceil(Date.now() / 1000) + ttlSeconds
  return { exp, sig: hmac(`${payload}.${exp}`) }
}

export function verifySignature(payload: string, exp: unknown, sig: unknown): boolean {
  const expNum = typeof exp === 'string' ? Number(exp) : (exp as number)
  if (!Number.isFinite(expNum) || expNum * 1000 < Date.now()) return false
  if (typeof sig !== 'string' || sig.length === 0) return false

  const expected = Buffer.from(hmac(`${payload}.${expNum}`))
  const provided = Buffer.from(sig)
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}
