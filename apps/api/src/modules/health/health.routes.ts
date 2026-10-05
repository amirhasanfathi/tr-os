import { Router } from 'express'
import type { HealthResponse, ReadinessResponse } from '@tr-life/shared'
import { asyncHandler } from '../../http/asyncHandler.js'
import { checkDatabase } from '../../db/prisma.js'

export const healthRouter = Router()

const startedAt = Date.now()

/** Liveness: the process is up. */
healthRouter.get('/health', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }
  res.json(body)
})

/** Readiness: dependencies (DB) are reachable. */
healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    const db = await checkDatabase()
    const body: ReadinessResponse = { ready: db, checks: { db } }
    res.status(db ? 200 : 503).json(body)
  }),
)
