import 'dotenv/config'
import { z } from 'zod'

/**
 * Single source of truth for runtime configuration.
 * `process.env` is parsed and validated once at import time; the rest of the
 * app imports the typed `env` object instead of touching `process.env`.
 */
const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true' || v === '1'))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: booleanish.default(true),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 chars'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./.storage'),
  STORAGE_SIGNED_URL_TTL: z.coerce.number().int().positive().default(300),
  // HMAC key used to sign/verify local storage URLs (the "signed URL" mechanism).
  STORAGE_SIGNING_KEY: z.string().min(16, 'STORAGE_SIGNING_KEY must be at least 16 chars').default('dev-only-storage-signing-key'),
  // Public base URL the storage routes are reachable at (for building signed URLs).
  STORAGE_PUBLIC_BASE_URL: z.string().url().default('http://localhost:4000'),
  // Upload constraints — validated server-side, never trusted from the client.
  STORAGE_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),

  // S3-compatible object storage (the `s3` driver). Also drives Supabase Storage via its
  // S3-compatible endpoint (set STORAGE_S3_ENDPOINT to `https://<ref>.storage.supabase.co`,
  // region `auto`, STORAGE_S3_FORCE_PATH_STYLE true). Required when STORAGE_DRIVER=s3;
  // the superRefine below fails the boot fast if any is missing.
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_REGION: z.string().optional(),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),
  STORAGE_S3_FORCE_PATH_STYLE: booleanish.default(true),

  // Background job queue. Only the in-memory driver is implemented (see
  // src/queue/index.ts); a durable Postgres/Redis driver is the right choice for
  // multi-instance deployments and is intentionally NOT fabricated here. Recompute
  // work is idempotent and re-triggered by cache staleness, so memory is safe for
  // this monolith.
  QUEUE_DRIVER: z.enum(['memory', 'postgres', 'redis']).default('memory'),
  QUEUE_ENABLED: booleanish.default(true),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().max(16).default(2),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  QUEUE_RETRY_DELAY_MS: z.coerce.number().int().min(0).default(2000),

  // How long a cached job_match is considered fresh before the read path asks the
  // queue to recompute it in the background (stale-while-revalidate).
  MATCH_CACHE_TTL_MS: z.coerce.number().int().min(0).default(6 * 60 * 60 * 1000),
}).superRefine((val, ctx) => {
  // The S3 driver needs a complete set of connection inputs. Fail fast at boot rather
  // than throwing the first time a document upload is requested. The endpoint is
  // optional (real AWS omits it; Supabase Storage needs its S3 endpoint).
  if (val.STORAGE_DRIVER !== 's3') return
  const required: Record<string, string | undefined> = {
    STORAGE_S3_BUCKET: val.STORAGE_S3_BUCKET,
    STORAGE_S3_REGION: val.STORAGE_S3_REGION,
    STORAGE_S3_ACCESS_KEY: val.STORAGE_S3_ACCESS_KEY,
    STORAGE_S3_SECRET_KEY: val.STORAGE_S3_SECRET_KEY,
  }
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required when STORAGE_DRIVER=s3` })
    }
  }
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  // Fail fast and loudly — never boot with an invalid configuration.
  // eslint-disable-next-line no-console
  console.error(`[config] Invalid environment configuration:\n${issues}`)
  throw new Error('Invalid environment configuration')
}

const raw = parsed.data

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
} as const

export type Env = typeof env

/** Guard against committing/using placeholder secrets in production. */
export function assertProductionSecrets(): void {
  if (!env.isProduction) return
  const weak = ['change-me-access-secret', 'change-me-refresh-secret']
  if (weak.includes(env.JWT_ACCESS_SECRET) || weak.includes(env.JWT_REFRESH_SECRET)) {
    throw new Error('[config] Refusing to start in production with placeholder JWT secrets')
  }
  if (env.STORAGE_SIGNING_KEY === 'dev-only-storage-signing-key') {
    throw new Error('[config] Refusing to start in production with the default STORAGE_SIGNING_KEY')
  }
}
