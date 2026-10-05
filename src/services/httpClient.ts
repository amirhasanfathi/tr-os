import { runtimeConfig } from '../config/runtime'

/**
 * Minimal typed HTTP client for the real API.
 *
 * This is the single seam the mock services will call once `VITE_DATA_SOURCE=http`.
 * It owns token storage + refresh so individual services stay trivial.
 */

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { field: string; message: string }[]; requestId?: string }
}

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: { field: string; message: string }[],
    readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

// ---------------- token store ----------------

const AUTH_KEY = 'trlife.auth'

export interface StoredAuth {
  accessToken: string
  refreshToken: string
}

export const tokenStore = {
  get(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? (JSON.parse(raw) as StoredAuth) : null
    } catch {
      return null
    }
  },
  set(auth: StoredAuth): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  },
  clear(): void {
    localStorage.removeItem(AUTH_KEY)
  },
}

// ---------------- client ----------------

const base = `${runtimeConfig.apiUrl}/api/${runtimeConfig.apiVersion}`

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

async function parseError(res: Response): Promise<ApiClientError> {
  let body: ApiErrorBody | undefined
  try {
    body = (await res.json()) as ApiErrorBody
  } catch {
    /* non-JSON error response */
  }
  return new ApiClientError(
    res.status,
    body?.error?.code ?? 'HTTP_ERROR',
    body?.error?.message ?? `Request failed with status ${res.status}`,
    body?.error?.details,
    body?.error?.requestId ?? res.headers.get('x-request-id') ?? undefined,
  )
}

async function rawRequest(path: string, opts: RequestOptions, accessToken?: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  return fetch(`${base}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })
}

/** Exchanges a refresh token for a fresh token pair. */
async function tryRefresh(): Promise<string | null> {
  const auth = tokenStore.get()
  if (!auth?.refreshToken) return null
  const res = await fetch(`${base}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken: auth.refreshToken }),
  })
  if (!res.ok) {
    tokenStore.clear()
    return null
  }
  const data = (await res.json()) as { tokens: StoredAuth }
  tokenStore.set({ accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken })
  return data.tokens.accessToken
}

/**
 * Performs a request; on 401 it attempts a single token refresh + retry.
 * Throws ApiClientError for any non-2xx response.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const useAuth = opts.auth !== false
  let accessToken = useAuth ? tokenStore.get()?.accessToken ?? null : null

  let res = await rawRequest(path, opts, accessToken)

  if (res.status === 401 && useAuth) {
    accessToken = await tryRefresh()
    if (accessToken) res = await rawRequest(path, opts, accessToken)
  }

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),
  del: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
