import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env.js'
import { badRequest } from '../http/errors.js'
import type { SignedUrlOptions, StorageDriver } from './types.js'

/**
 * S3-compatible object storage driver.
 *
 * Works with AWS S3 and any S3-compatible provider — including Supabase Storage's
 * S3 endpoint (set STORAGE_S3_ENDPOINT to `https://<ref>.storage.supabase.co`,
 * region `auto`, forcePathStyle true). Bytes go directly to the provider via a
 * presigned PUT; the API never proxies file content and never stores it in Postgres.
 *
 * Same trust model as the local driver:
 *  - Keys are server-generated and opaque; the client filename is never used here.
 *  - Uploads/downloads are authorized by a time-bounded presigned URL (SigV4), not
 *    by a session, so the browser talks to the provider directly.
 *  - A presigned GET overrides the response to an opaque attachment, mirroring the
 *    local `/storage` router's "we never trust a client content type" stance.
 */

// Defense-in-depth on the object key. Keys are server-generated, but reject anything
// that could escape the bucket prefix (leading slash, parent traversal, empty segments).
function assertSafeKey(key: string): string {
  const normalized = key
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg.length > 0 && seg !== '.')
    .join('/')
  if (!normalized || normalized.includes('..') || normalized.startsWith('/')) {
    throw badRequest('Invalid storage key')
  }
  return normalized
}

// A 404/NotFound from the provider means "absent"; anything else is a real error and
// must propagate (we never mask auth/network faults as "does not exist").
function isNotFound(err: unknown): boolean {
  if (err instanceof S3ServiceException) {
    return err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404
  }
  return false
}

export class S3StorageDriver implements StorageDriver {
  readonly name = 's3'
  private readonly client: S3Client
  private readonly bucket: string

  constructor() {
    const bucket = env.STORAGE_S3_BUCKET
    const region = env.STORAGE_S3_REGION
    const accessKeyId = env.STORAGE_S3_ACCESS_KEY
    const secretAccessKey = env.STORAGE_S3_SECRET_KEY
    // config/env.ts superRefine guarantees these are present when STORAGE_DRIVER=s3;
    // this is a defensive second check so a misconfigured driver fails loudly at boot.
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('[storage] STORAGE_DRIVER=s3 requires bucket, region, access key and secret key')
    }
    this.bucket = bucket
    this.client = new S3Client({
      region,
      // Endpoint is optional: omit for real AWS, set the provider URL otherwise.
      ...(env.STORAGE_S3_ENDPOINT ? { endpoint: env.STORAGE_S3_ENDPOINT } : {}),
      forcePathStyle: env.STORAGE_S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  async put(key: string, data: Buffer): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: assertSafeKey(key), Body: data }))
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: assertSafeKey(key) }))
      return true
    } catch (err) {
      if (isNotFound(err)) return false
      throw err
    }
  }

  async delete(key: string): Promise<void> {
    // S3 DeleteObject is idempotent; tolerate an already-absent key but surface real faults.
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: assertSafeKey(key) }))
    } catch (err) {
      if (isNotFound(err)) return
      throw err
    }
  }

  async createSignedGetUrl(key: string, opts?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: assertSafeKey(key),
      // Serve back as an opaque download regardless of the stored content type.
      ResponseContentType: 'application/octet-stream',
      ResponseContentDisposition: 'attachment',
    })
    return getSignedUrl(this.client, command, {
      expiresIn: opts?.expiresInSec ?? env.STORAGE_SIGNED_URL_TTL,
    })
  }

  async createSignedPutUrl(key: string, opts?: SignedUrlOptions): Promise<string> {
    // Content type is validated server-side at ticket creation (allowlisted MIME → extension),
    // so we presign a bare PUT; the browser's Content-Type need not match a signed value.
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: assertSafeKey(key) })
    return getSignedUrl(this.client, command, {
      expiresIn: opts?.expiresInSec ?? env.STORAGE_SIGNED_URL_TTL,
    })
  }
}
