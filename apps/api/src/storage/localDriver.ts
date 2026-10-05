import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { env } from '../config/env.js'
import { createSignature } from './signing.js'
import type { SignedUrlOptions, StorageDriver } from './types.js'

const rootDir = resolve(env.STORAGE_LOCAL_DIR)

/**
 * Resolves a storage key to an absolute path strictly inside `rootDir`.
 * Rejects traversal ("../") and absolute keys — the key comes from a URL path.
 */
export function resolveKey(key: string): string {
  const normalized = key
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg.length > 0 && seg !== '.')
    .join('/')
  const full = resolve(rootDir, normalized)
  if (full !== rootDir && !full.startsWith(rootDir + sep)) {
    throw new Error('Invalid storage key')
  }
  return full
}

function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

function buildUrl(op: 'get' | 'put', key: string, opts?: SignedUrlOptions): string {
  const ttl = opts?.expiresInSec ?? env.STORAGE_SIGNED_URL_TTL
  const { exp, sig } = createSignature(`${op}:${key}`, ttl)
  return `${env.STORAGE_PUBLIC_BASE_URL}/storage/${op}/${encodeKey(key)}?exp=${exp}&sig=${sig}`
}

export class LocalStorageDriver implements StorageDriver {
  readonly name = 'local'

  async put(key: string, data: Buffer): Promise<void> {
    const full = resolveKey(key)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, data)
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(resolveKey(key))
      return true
    } catch {
      return false
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(resolveKey(key))
    } catch {
      // Already absent — deletion is idempotent.
    }
  }

  async createSignedGetUrl(key: string, opts?: SignedUrlOptions): Promise<string> {
    return buildUrl('get', key, opts)
  }

  async createSignedPutUrl(key: string, opts?: SignedUrlOptions): Promise<string> {
    return buildUrl('put', key, opts)
  }
}
