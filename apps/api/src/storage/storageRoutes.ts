import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Router } from 'express'
import { asyncHandler } from '../http/asyncHandler.js'
import { badRequest, forbidden, notFound } from '../http/errors.js'
import { env } from '../config/env.js'
import { resolveKey } from './localDriver.js'
import { verifySignature } from './signing.js'

/**
 * Serves the local-disk storage driver's signed URLs. Access is authorized by the
 * HMAC signature + expiry (see storage/signing.ts) — NOT by session auth, because
 * these URLs are meant to be handed to a browser/download manager directly.
 *
 * Only used when STORAGE_DRIVER=local. An S3 driver would return provider-signed
 * URLs and this router would be unused.
 */
export const storageRouter = Router()

const ALLOWED_UPLOAD_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png'])

function wildcardKey(params: Record<string, unknown>): string {
  const key = params[0]
  if (typeof key !== 'string' || key.length === 0) throw notFound('Object not found')
  return key
}

storageRouter.get(
  '/get/*',
  asyncHandler(async (req, res) => {
    const key = wildcardKey(req.params as Record<string, unknown>)
    if (!verifySignature(`get:${key}`, req.query.exp, req.query.sig)) {
      throw forbidden('Invalid or expired signature')
    }

    const full = resolveKey(key)
    let size: number
    try {
      size = (await stat(full)).size
    } catch {
      throw notFound('Object not found')
    }

    // Served as an opaque download; we never trust a client-supplied content type.
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Length', String(size))
    res.setHeader('Content-Disposition', 'attachment')
    res.setHeader('Cache-Control', 'private, no-store')
    createReadStream(full).pipe(res)
  }),
)

storageRouter.put(
  '/put/*',
  asyncHandler(async (req, res) => {
    const key = wildcardKey(req.params as Record<string, unknown>)
    if (!verifySignature(`put:${key}`, req.query.exp, req.query.sig)) {
      throw forbidden('Invalid or expired signature')
    }

    const contentType = String(req.headers['content-type'] ?? '').split(';')[0].trim()
    if (!ALLOWED_UPLOAD_MIME.has(contentType)) {
      throw badRequest('Unsupported content type')
    }

    const declared = Number(req.headers['content-length'] ?? 0)
    if (!Number.isFinite(declared) || declared <= 0) throw badRequest('Empty upload')
    if (declared > env.STORAGE_MAX_UPLOAD_BYTES) throw badRequest('File exceeds maximum size')

    // Stream the body, enforcing the size cap as we go (never buffer blindly).
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
      size += buf.length
      if (size > env.STORAGE_MAX_UPLOAD_BYTES) throw badRequest('File exceeds maximum size')
      chunks.push(buf)
    }
    if (size === 0) throw badRequest('Empty upload')

    const full = resolveKey(key)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, Buffer.concat(chunks))

    res.status(201).json({ ok: true, key, sizeBytes: size, mimeType: contentType })
  }),
)
