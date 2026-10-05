import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import { Role } from '@tr-life/shared'
import { signAccessToken, verifyAccessToken, accessTokenTtlSeconds } from '../src/modules/auth/tokens.js'

// The verification path pins HS256 (P17). These tests prove a legitimate token
// round-trips and that algorithm-confusion / foreign-secret forgeries are rejected.

test('access tokens are signed with the pinned HS256 algorithm', () => {
  const token = signAccessToken({ sub: 'u-1', role: Role.USER })
  const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString())
  assert.equal(header.alg, 'HS256')
})

test('a valid token round-trips its subject, role and version', () => {
  const payload = { sub: 'u-9', role: Role.ADMIN, ver: 3 }
  assert.deepEqual(verifyAccessToken(signAccessToken(payload)), payload)
})

test('an unsigned (alg:none) forged token is rejected', () => {
  const forged = jwt.sign({ sub: 'x', role: Role.SUPER_ADMIN }, '', { algorithm: 'none' })
  assert.throws(() => verifyAccessToken(forged))
})

test('a token signed with a different secret is rejected', () => {
  const foreign = jwt.sign({ sub: 'x', role: Role.ADMIN }, 'not-the-real-secret', { algorithm: 'HS256' })
  assert.throws(() => verifyAccessToken(foreign))
})

test('an expired token is rejected', () => {
  const expired = jwt.sign({ sub: 'x', role: Role.USER }, process.env.JWT_ACCESS_SECRET as string, {
    algorithm: 'HS256',
    expiresIn: '-1s',
  })
  assert.throws(() => verifyAccessToken(expired))
})

test('TTL parsing derives seconds from the configured duration', () => {
  assert.equal(accessTokenTtlSeconds(), 900) // default 15m
})
