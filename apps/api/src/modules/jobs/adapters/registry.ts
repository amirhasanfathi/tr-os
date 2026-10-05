import type { JobSourceAdapter } from './types.js'

/**
 * Adapter registry. Real, authorized integrations are registered here (and their
 * matching `JobSource` row flipped to `enabled`). It is intentionally empty:
 * no external job integration is fabricated, and scraping is not permitted.
 * Until an adapter is registered AND its source is enabled, `syncSource` refuses
 * to run, so the API never implies a live sync that does not exist.
 */
const adapters = new Map<string, JobSourceAdapter>()

export function registerAdapter(adapter: JobSourceAdapter): void {
  adapters.set(adapter.key, adapter)
}

export function getAdapter(key: string): JobSourceAdapter | undefined {
  return adapters.get(key)
}

export function listAdapterKeys(): string[] {
  return [...adapters.keys()]
}
