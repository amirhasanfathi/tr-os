export interface SignedUrlOptions {
  expiresInSec?: number
}

/**
 * Object-storage abstraction. Files are NEVER stored in PostgreSQL — the DB holds
 * only metadata + a `storageKey`; bytes live behind a driver. `local` is the dev
 * driver; an S3-compatible driver can be added for production without touching
 * callers.
 */
export interface StorageDriver {
  readonly name: string
  put(key: string, data: Buffer): Promise<void>
  exists(key: string): Promise<boolean>
  delete(key: string): Promise<void>
  // Presigning is async for the S3-compatible driver (SigV4), so both are promises;
  // the local driver resolves immediately. Callers `await` them.
  createSignedGetUrl(key: string, opts?: SignedUrlOptions): Promise<string>
  createSignedPutUrl(key: string, opts?: SignedUrlOptions): Promise<string>
}
