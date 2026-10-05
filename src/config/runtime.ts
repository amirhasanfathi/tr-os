/**
 * Frontend runtime configuration.
 *
 * `dataSource` is the seam that lets every service flip between the in-memory
 * mock layer (default, keeps the prototype runnable with zero setup) and the
 * real HTTP API — without any page/component changing.
 *
 * Set in a `.env` at the repo root:
 *   VITE_DATA_SOURCE=http
 *   VITE_API_URL=http://localhost:4000
 */
export const runtimeConfig = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? 'mock') as 'mock' | 'http',
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  apiVersion: 'v1',
} as const

export const useHttp = runtimeConfig.dataSource === 'http'
