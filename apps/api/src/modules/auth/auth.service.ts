import bcrypt from 'bcryptjs'
import type { AuthResponse, SessionUser } from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { env } from '../../config/env.js'
import { conflict, unauthorized } from '../../http/errors.js'
import { accessTokenTtlSeconds, signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens.js'
import type { LoginInput, RegisterInput } from './auth.validation.js'
import type { User } from '@prisma/client'

function issueTokens(user: User) {
  const payload = { sub: user.id, role: user.role, ver: user.tokenVersion }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: accessTokenTtlSeconds(),
    tokenType: 'Bearer' as const,
  }
}

/** The ONLY user representation that ever leaves the API. No password hash. */
export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    city: user.city,
    country: user.country,
    onboarded: user.onboarded,
    createdAt: user.createdAt.toISOString(),
  }
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw conflict('An account with this email already exists', [
      { field: 'email', message: 'already registered' },
    ])
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      city: input.city ?? null,
      country: input.country ?? 'TR',
      profile: { create: {} },
    },
  })

  return { user: toSessionUser(user), tokens: issueTokens(user) }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findFirst({
    where: { email: input.email, deletedAt: null },
  })
  // Uniform error for unknown email vs. wrong password (no user enumeration).
  if (!user) throw unauthorized('Invalid email or password')

  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) throw unauthorized('Invalid email or password')

  return { user: toSessionUser(user), tokens: issueTokens(user) }
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw unauthorized('Invalid or expired refresh token')
  }

  const user = await prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null } })
  if (!user) throw unauthorized('Account no longer exists')
  // Reject tokens issued before a logout/password-change (tokenVersion bump).
  if (payload.ver !== undefined && payload.ver !== user.tokenVersion) {
    throw unauthorized('Refresh token has been revoked')
  }

  return { user: toSessionUser(user), tokens: issueTokens(user) }
}

export async function me(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } })
  if (!user) throw unauthorized('Account no longer exists')
  return toSessionUser(user)
}

/** Logout = revoke all refresh tokens by bumping tokenVersion. */
export async function logout(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
}
