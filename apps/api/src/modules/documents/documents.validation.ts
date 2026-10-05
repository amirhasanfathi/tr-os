import { z } from 'zod'
import { env } from '../../config/env.js'

export const documentTypeSchema = z.enum([
  'passport',
  'residence',
  'insurance',
  'rental_contract',
  'tax',
  'education',
  'cv',
  'other',
])

export const initiateUploadSchema = z.object({
  type: documentTypeSchema,
  // Metadata only — the server derives the storage key/extension, never trusting this.
  originalFilename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(env.STORAGE_MAX_UPLOAD_BYTES),
})

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
})

export type InitiateUploadInput = z.infer<typeof initiateUploadSchema>
