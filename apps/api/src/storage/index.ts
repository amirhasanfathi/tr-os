import { env } from '../config/env.js'
import { LocalStorageDriver } from './localDriver.js'
import { S3StorageDriver } from './s3Driver.js'
import type { StorageDriver } from './types.js'

let driver: StorageDriver | null = null

/**
 * Returns the configured storage driver (singleton).
 * `local` is the dev driver; `s3` is an S3-compatible driver used for production and
 * for Supabase Storage (its S3 endpoint). Config for `s3` is validated at boot, so a
 * misconfigured driver cannot be reached here.
 */
export function getStorage(): StorageDriver {
  if (driver) return driver
  if (env.STORAGE_DRIVER === 'local') {
    driver = new LocalStorageDriver()
    return driver
  }
  if (env.STORAGE_DRIVER === 's3') {
    driver = new S3StorageDriver()
    return driver
  }
  throw new Error(`[storage] Unknown STORAGE_DRIVER "${env.STORAGE_DRIVER}" (expected local or s3)`)
}

export type { StorageDriver, SignedUrlOptions } from './types.js'
export { resolveKey } from './localDriver.js'
