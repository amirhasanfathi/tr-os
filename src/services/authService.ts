// Auth service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo user, no real authentication (prototype).
//   * http           — talks to the API's /auth/* endpoints via httpClient.
//
// The wire shapes below mirror @tr-life/shared (packages/shared/src/dto.ts),
// which is the authoritative API contract. They are duplicated here only
// because the web app is not yet part of the npm workspace.

import { useHttp } from '../config/runtime'
import { demoUser } from '../data/mockData'
import { http, tokenStore } from './httpClient'
import type { User } from '../types'

interface SessionUserDTO {
  id: string
  fullName: string
  email: string
  role: 'USER' | 'PROVIDER' | 'ADMIN' | 'SUPER_ADMIN'
  city: string | null
  country: 'IR' | 'TR'
  onboarded: boolean
  createdAt: string
}

interface AuthTokensDTO {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

interface AuthResponseDTO {
  user: SessionUserDTO
  tokens: AuthTokensDTO
}

function toUser(su: SessionUserDTO): User {
  return {
    id: su.id,
    fullName: su.fullName,
    email: su.email,
    city: su.city ?? '',
    country: su.country,
    createdAt: su.createdAt,
    onboarded: su.onboarded,
  }
}

let currentUser: User | null = demoUser

export async function getSession(): Promise<User | null> {
  if (useHttp) {
    if (!tokenStore.get()) return null
    try {
      return toUser(await http.get<SessionUserDTO>('/auth/me'))
    } catch {
      // Expired/invalid session — drop tokens and treat as signed-out.
      tokenStore.clear()
      return null
    }
  }
  return currentUser
}

export async function login(email: string, password: string): Promise<User> {
  if (useHttp) {
    const res = await http.post<AuthResponseDTO>('/auth/login', { email, password }, { auth: false })
    tokenStore.set({ accessToken: res.tokens.accessToken, refreshToken: res.tokens.refreshToken })
    currentUser = toUser(res.user)
    return currentUser
  }
  currentUser = demoUser
  return demoUser
}

export async function logout(): Promise<void> {
  if (useHttp) {
    try {
      await http.post<void>('/auth/logout', undefined)
    } catch {
      // Best-effort server revocation; always clear local tokens.
    }
    tokenStore.clear()
    currentUser = null
    return
  }
  currentUser = null
}
