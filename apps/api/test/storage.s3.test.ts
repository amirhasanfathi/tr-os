import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// The S3 driver inputs MUST be present before `config/env` is first imported, because
// env is a parse-once singleton and STORAGE_DRIVER=s3 triggers its boot validation.
// node:test runs each file in its own process, so setting these here (before the
// dynamic import below) gives this file a clean, self-contained env.
process.env.STORAGE_DRIVER = 's3'
process.env.STORAGE_S3_BUCKET = 'trlife-docs'
process.env.STORAGE_S3_REGION = 'auto'
process.env.STORAGE_S3_ENDPOINT = 'https://exampleproj.storage.supabase.co'
process.env.STORAGE_S3_ACCESS_KEY = 'test-access-key'
process.env.STORAGE_S3_SECRET_KEY = 'test-secret-key'
process.env.STORAGE_S3_FORCE_PATH_STYLE = 'true'

// Dynamic import so the driver (and config/env it pulls in) loads AFTER the vars above.
const { S3StorageDriver } = await import('../src/storage/s3Driver.js')

const KEY = 'documents/u1/abc/abc.pdf'
const driver = new S3StorageDriver()

// These tests are offline by design: generating a presigned URL is a local SigV4
// computation (it never contacts the provider). put/exists/delete DO hit the network
// and are intentionally not exercised here — there is no fake-able S3 in the sandbox,
// and fabricating one would be dishonest.

test('a presigned PUT URL points at the provider, is path-style, and is SigV4-signed', async () => {
  const url = new URL(await driver.createSignedPutUrl(KEY, { expiresInSec: 300 }))
  assert.equal(url.protocol, 'https:')
  assert.equal(url.hostname, 'exampleproj.storage.supabase.co')
  // forcePathStyle → bucket is the first path segment, then the opaque object key.
  assert.ok(url.pathname.startsWith('/trlife-docs/documents/u1/abc/abc.pdf'), url.pathname)
  // SigV4 query params prove it is a real signed URL, not a plain link.
  assert.equal(url.searchParams.get('X-Amz-Algorithm'), 'AWS4-HMAC-SHA256')
  assert.equal(url.searchParams.get('X-Amz-Expires'), '300')
  assert.ok(url.searchParams.get('X-Amz-Signature'))
  assert.ok(url.searchParams.get('X-Amz-Credential')?.includes('test-access-key'))
})

test('a presigned GET URL forces an opaque attachment download', async () => {
  const url = new URL(await driver.createSignedGetUrl(KEY, { expiresInSec: 60 }))
  assert.equal(url.searchParams.get('X-Amz-Expires'), '60')
  // Response overrides must survive into the signed query (never trust stored type).
  assert.equal(url.searchParams.get('response-content-disposition'), 'attachment')
  assert.equal(url.searchParams.get('response-content-type'), 'application/octet-stream')
})

test('a traversal key is rejected before any request is signed', async () => {
  await assert.rejects(() => driver.createSignedGetUrl('../../etc/passwd'), /Invalid storage key/)
  await assert.rejects(() => driver.createSignedPutUrl('documents//../secret'), /Invalid storage key/)
})
