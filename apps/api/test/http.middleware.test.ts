import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { Role } from '@tr-life/shared'
import { validate } from '../src/middleware/validate.js'
import { authenticate } from '../src/middleware/authenticate.js'
import { authorize } from '../src/middleware/authorize.js'
import { signAccessToken } from '../src/modules/auth/tokens.js'
import { toErrorEnvelope } from '../src/http/errorHandler.js'
import { HttpError, notFound } from '../src/http/errors.js'

// Minimal fakes for the Express middleware contracts.
const dummyRes = {} as unknown as Response
type Req = Record<string, unknown>
const asReq = (o: Req): Request => o as unknown as Request

// ---- validate(): strips unknown keys, coerces/bounds, reports field errors ----

test('validate replaces req parts with parsed data (drops unknown keys)', () => {
  const req = asReq({ body: { a: 1, evil: 'x' }, query: {}, params: {} })
  validate({ body: z.object({ a: z.number() }) })(req, dummyRes, () => {})
  assert.deepEqual(req.body, { a: 1 })
})

test('validate applies coercion and defaults', () => {
  const req = asReq({ body: {}, query: {}, params: {} })
  validate({ query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }) })(req, dummyRes, () => {})
  assert.deepEqual(req.query, { limit: 50 })
})

test('validate emits a 422 with field-level details on failure', () => {
  const req = asReq({ body: { age: 'not-a-number' }, query: {}, params: {} })
  let err: unknown
  validate({ body: z.object({ age: z.number() }) })(req, dummyRes, (e) => {
    err = e
  })
  assert.ok(err instanceof HttpError)
  const http = err as HttpError
  assert.equal(http.status, 422)
  assert.equal(http.code, 'UNPROCESSABLE_ENTITY')
  assert.ok(http.details?.some((d) => d.field === 'body.age'))
})

// ---- authenticate + authorize: the server-side trust boundary ----

const runAuthenticate = (req: Req): { user?: unknown; err?: HttpError } => {
  let err: HttpError | undefined
  let passed = false
  const next: NextFunction = (e) => {
    if (e) err = e as HttpError
    else passed = true
  }
  authenticate(asReq(req), dummyRes, next)
  return { err, ...(passed ? { user: req.user } : {}) }
}

test('authenticate rejects a missing bearer token with 401', () => {
  assert.equal(runAuthenticate({ headers: {} }).err?.status, 401)
})

test('authenticate populates req.user from a valid token (never from body)', () => {
  const token = signAccessToken({ sub: 'u-1', role: Role.USER })
  const res = runAuthenticate({ headers: { authorization: `Bearer ${token}` } })
  assert.deepEqual(res.user, { userId: 'u-1', role: Role.USER })
})

test('authenticate rejects a garbage token with 401', () => {
  assert.equal(runAuthenticate({ headers: { authorization: 'Bearer nonsense' } }).err?.status, 401)
})

const runAuthorize = (req: Req, roles: Role[]): HttpError | 'pass' => {
  let out: HttpError | 'pass' = 'pass'
  authorize(...roles)(asReq(req), dummyRes, (e) => {
    if (e) out = e as HttpError
  })
  return out
}

test('authorize 401s when unauthenticated, 403s on role mismatch, passes on match', () => {
  assert.equal((runAuthorize({}, [Role.ADMIN]) as HttpError).status, 401)
  assert.equal((runAuthorize({ user: { userId: 'u', role: Role.USER } }, [Role.ADMIN]) as HttpError).status, 403)
  assert.equal(runAuthorize({ user: { userId: 'u', role: Role.ADMIN } }, [Role.ADMIN, Role.SUPER_ADMIN]), 'pass')
})

// ---- central error envelope ----

test('HttpError maps to its code/message with the requestId echoed', () => {
  assert.deepEqual(toErrorEnvelope(notFound('gone'), 'req-1'), {
    error: { code: 'NOT_FOUND', message: 'gone', requestId: 'req-1' },
  })
})

test('ZodError maps to 422 with details', () => {
  const zodErr = z.string().safeParse(42).error as z.ZodError
  const env = toErrorEnvelope(zodErr)
  assert.equal(env.error.code, 'UNPROCESSABLE_ENTITY')
  assert.ok(env.error.details && env.error.details.length >= 1)
})

test('Prisma known-request errors map to stable statuses', () => {
  const dup = new Prisma.PrismaClientKnownRequestError('dup', {
    code: 'P2002',
    clientVersion: '5.22.0',
    meta: { target: ['email'] },
  })
  assert.equal(toErrorEnvelope(dup).error.code, 'CONFLICT')
  const missing = new Prisma.PrismaClientKnownRequestError('gone', { code: 'P2025', clientVersion: '5.22.0' })
  assert.equal(toErrorEnvelope(missing).error.code, 'NOT_FOUND')
})

test('an unexpected error surfaces as INTERNAL_ERROR', () => {
  assert.equal(toErrorEnvelope(new Error('boom')).error.code, 'INTERNAL_ERROR')
})
