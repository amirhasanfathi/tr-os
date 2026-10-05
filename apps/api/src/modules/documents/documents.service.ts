import { randomUUID } from 'node:crypto'
import type { Document as PrismaDocument } from '@prisma/client'
import type {
  DocumentResponse,
  DocumentType,
  DownloadTicket,
  UploadTicket,
} from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { env } from '../../config/env.js'
import { badRequest, notFound } from '../../http/errors.js'
import { getStorage } from '../../storage/index.js'
import type { InitiateUploadInput } from './documents.validation.js'

// Extension is derived from the (allowlisted) MIME type — never from the client filename.
const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

function toDocumentResponse(d: PrismaDocument): DocumentResponse {
  return {
    id: d.id,
    type: d.type as DocumentType,
    status: d.status as DocumentResponse['status'],
    verification: d.verification as DocumentResponse['verification'],
    originalFilename: d.originalFilename,
    mimeType: d.mimeType,
    sizeBytes: d.sizeBytes,
    expiresAt: d.expiresAt?.toISOString() ?? null,
    uploadedAt: d.uploadedAt.toISOString(),
    hasFile: d.fileUploaded,
  }
}

/** Ownership is always scoped by the authenticated userId — never taken from input. */
async function findOwned(userId: string, id: string): Promise<PrismaDocument> {
  const doc = await prisma.document.findFirst({ where: { id, userId, deletedAt: null } })
  if (!doc) throw notFound('Document not found')
  return doc
}

export async function listDocuments(userId: string): Promise<DocumentResponse[]> {
  const docs = await prisma.document.findMany({
    where: { userId, deletedAt: null },
    orderBy: { uploadedAt: 'desc' },
  })
  return docs.map(toDocumentResponse)
}

export async function getDocument(userId: string, id: string): Promise<DocumentResponse> {
  return toDocumentResponse(await findOwned(userId, id))
}

export async function initiateUpload(userId: string, input: InitiateUploadInput): Promise<UploadTicket> {
  const ext = EXT_BY_MIME[input.mimeType]
  if (!ext) throw badRequest('Unsupported file type', [{ field: 'mimeType', message: 'must be pdf, jpeg or png' }])

  const id = randomUUID()
  // Server-generated key: scoped to the owner, opaque, extension from MIME — the
  // client-provided filename is stored as metadata only and never used in the path.
  const storageKey = `documents/${userId}/${id}/${id}.${ext}`

  await prisma.document.create({
    data: {
      id,
      userId,
      type: input.type as PrismaDocument['type'],
      originalFilename: input.originalFilename,
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      status: 'pending',
      verification: 'unverified',
      fileUploaded: false,
    },
  })

  const storage = getStorage()
  const uploadUrl = await storage.createSignedPutUrl(storageKey)
  return {
    documentId: id,
    uploadUrl,
    method: 'PUT',
    maxBytes: env.STORAGE_MAX_UPLOAD_BYTES,
    expiresAt: new Date(Date.now() + env.STORAGE_SIGNED_URL_TTL * 1000).toISOString(),
  }
}

export async function completeUpload(userId: string, id: string): Promise<DocumentResponse> {
  const doc = await findOwned(userId, id)
  const storage = getStorage()
  if (!(await storage.exists(doc.storageKey))) {
    throw badRequest('No uploaded file found; PUT the bytes to the signed uploadUrl first')
  }

  const updated = await prisma.document.update({
    where: { id: doc.id },
    data: { fileUploaded: true, status: 'ready', uploadedAt: new Date() },
  })

  // Keep an immutable version record for each successfully stored upload.
  await prisma.documentVersion.create({
    data: {
      documentId: updated.id,
      storageKey: updated.storageKey,
      mimeType: updated.mimeType,
      sizeBytes: updated.sizeBytes,
    },
  })

  return toDocumentResponse(updated)
}

export async function getDownloadUrl(userId: string, id: string): Promise<DownloadTicket> {
  const doc = await findOwned(userId, id)
  if (!doc.fileUploaded) throw notFound('No file has been uploaded for this document')

  const storage = getStorage()
  if (!(await storage.exists(doc.storageKey))) throw notFound('Stored file is missing')

  const url = await storage.createSignedGetUrl(doc.storageKey)
  return {
    url,
    method: 'GET',
    expiresAt: new Date(Date.now() + env.STORAGE_SIGNED_URL_TTL * 1000).toISOString(),
  }
}

export async function deleteDocument(userId: string, id: string): Promise<void> {
  const doc = await findOwned(userId, id)
  // Soft delete: metadata is retained for audit; bytes stay in storage.
  await prisma.document.update({ where: { id: doc.id }, data: { deletedAt: new Date() } })
}
