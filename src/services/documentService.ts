// Documents service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo documents; uploads are simulated.
//   * http           — real API: list, download URLs, and a genuine
//                      initiate → PUT bytes → complete upload flow.
//
// The DTO shapes below mirror @tr-life/shared (packages/shared/src/dto.ts),
// duplicated only because the web app is not yet part of the npm workspace.
//
// Files never pass through the API as base64: the client PUTs bytes straight to
// the signed storage URL the server hands back, so PostgreSQL only ever sees
// metadata + a storage key.

import { useHttp } from '../config/runtime'
import { demoDocuments } from '../data/mockData'
import { formatDate } from '../lib/format'
import { http } from './httpClient'
import type { Document, DocumentStatus, DocumentType } from '../types'

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

interface DocumentResponseDTO {
  id: string
  type: DocumentType
  status: DocumentStatus
  verification: VerificationStatus
  originalFilename: string
  mimeType: string
  sizeBytes: number
  expiresAt: string | null
  uploadedAt: string
  hasFile: boolean
}

interface UploadTicketDTO {
  documentId: string
  uploadUrl: string
  method: 'PUT'
  maxBytes: number
  expiresAt: string
}

interface DownloadTicketDTO {
  url: string
  method: 'GET'
  expiresAt: string
}

// Icon per document type — the view model drives the card glyph from `type` so
// mock and HTTP rows render identically.
const ICON_BY_TYPE: Record<DocumentType, string> = {
  passport: 'BookUser',
  residence: 'IdCard',
  insurance: 'ShieldCheck',
  rental_contract: 'Home',
  tax: 'Receipt',
  education: 'GraduationCap',
  cv: 'FileText',
  other: 'FileText',
}

/** Locale-appropriate date (Jalali in `fa`) from a real ISO timestamp; null stays null. */
function dateLabel(iso: string | null): string | null {
  if (!iso) return null
  return formatDate(iso)
}

function toDocument(d: DocumentResponseDTO): Document {
  return {
    id: d.id,
    type: d.type,
    // The page derives the localized name from `type`; this is a plain fallback.
    name: d.originalFilename,
    icon: ICON_BY_TYPE[d.type] ?? 'FileText',
    status: d.status,
    expiryDate: dateLabel(d.expiresAt),
    lastUpdated: dateLabel(d.uploadedAt) ?? '—',
    fileName: d.hasFile ? d.originalFilename : undefined,
    hasFile: d.hasFile,
  }
}

let documents: Document[] = demoDocuments.map((d) => ({ ...d }))

export async function getDocuments(): Promise<Document[]> {
  if (useHttp) {
    const rows = await http.get<DocumentResponseDTO[]>('/documents')
    documents = rows.map(toDocument)
    return documents
  }
  return documents
}

export async function updateDocumentStatus(id: string, status: DocumentStatus): Promise<Document[]> {
  documents = documents.map((d) => (d.id === id ? { ...d, status } : d))
  return documents
}

/**
 * Simulated upload used by the prototype UI (mock mode). It only flips the row
 * to ready and records a filename — no bytes are stored.
 */
export async function uploadDocument(id: string, fileName: string): Promise<Document[]> {
  if (useHttp) {
    // In HTTP mode the real flow is uploadDocumentFile(); refuse to fake it.
    throw new Error('Simulated upload is unavailable in HTTP mode; use uploadDocumentFile().')
  }
  documents = documents.map((d) =>
    d.id === id ? { ...d, fileName, status: 'ready' as const, hasFile: true } : d,
  )
  return documents
}

/**
 * Real upload: create metadata + get a signed PUT URL, stream the bytes to
 * object storage, then confirm. Returns the refreshed document list.
 */
export async function uploadDocumentFile(type: DocumentType, file: File): Promise<Document[]> {
  if (!useHttp) {
    // Mock mode has no object storage; the UI uses the simulated uploadDocument().
    throw new Error('Real file upload is unavailable in mock mode; use uploadDocument().')
  }

  const ticket = await http.post<UploadTicketDTO>('/documents/uploads', {
    type,
    originalFilename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  })

  const put = await fetch(ticket.uploadUrl, {
    method: ticket.method,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!put.ok) throw new Error(`Storage upload failed with status ${put.status}`)

  await http.post<DocumentResponseDTO>(`/documents/${ticket.documentId}/complete`)
  return getDocuments()
}

/** Returns a short-lived signed download URL, or null when no file is stored. */
export async function getDownloadUrl(id: string): Promise<string | null> {
  if (!useHttp) return null
  const doc = documents.find((d) => d.id === id)
  if (doc && !doc.hasFile) return null
  const ticket = await http.get<DownloadTicketDTO>(`/documents/${id}/download`)
  return ticket.url
}
