import express, { type Express, Router } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './http/logger.js'
import { REQUEST_ID_HEADER, resolveRequestId } from './http/requestContext.js'
import { errorHandler } from './http/errorHandler.js'
import { notFoundHandler } from './http/notFound.js'
import { apiLimiter } from './middleware/rateLimit.js'
import { healthRouter } from './modules/health/health.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { profileRouter } from './modules/profile/profile.routes.js'
import { documentsRouter } from './modules/documents/documents.routes.js'
import { journeyRouter, tasksRouter } from './modules/journey/journey.routes.js'
import { jobsRouter } from './modules/jobs/jobs.routes.js'
import { careerRouter } from './modules/career/career.routes.js'
import { providersRouter } from './modules/providers/providers.routes.js'
import { ticketsRouter } from './modules/tickets/tickets.routes.js'
import { notificationsRouter } from './modules/notifications/notifications.routes.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { storageRouter } from './storage/storageRoutes.js'

export function createApp(): Express {
  const app = express()

  // Behind a reverse proxy in production so req.ip / rate-limit keys are correct.
  if (env.isProduction) app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(helmet())
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', REQUEST_ID_HEADER],
      exposedHeaders: [REQUEST_ID_HEADER],
    }),
  )
  app.use(cookieParser())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  // Structured request logging with a correlation id echoed to the client.
  app.use(
    pinoHttp({
      logger,
      // Never write credentials to logs. pino-http redacts cookie/set-cookie by
      // default but NOT the Authorization header, so the bearer token is added
      // explicitly here.
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        censor: '[REDACTED]',
      },
      genReqId: (req, res) => {
        const id = resolveRequestId(req, res)
        res.setHeader(REQUEST_ID_HEADER, id)
        return id
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
    }),
  )

  // Infra probes (unversioned).
  app.use(healthRouter)

  // Signed-URL object access for the local storage driver (unversioned, not
  // session-authenticated — authorized by the HMAC signature instead).
  app.use('/storage', storageRouter)

  // Versioned API surface.
  const v1 = Router()
  v1.use('/auth', authRouter)
  v1.use('/profile', profileRouter)
  v1.use('/documents', documentsRouter)
  v1.use('/journey', journeyRouter)
  v1.use('/tasks', tasksRouter)
  v1.use('/jobs', jobsRouter)
  v1.use('/career', careerRouter)
  v1.use('/providers', providersRouter)
  v1.use('/tickets', ticketsRouter)
  v1.use('/notifications', notificationsRouter)
  v1.use('/admin', adminRouter)
  // Future modules mount here.
  app.use(`/api/${env.API_VERSION}`, apiLimiter, v1)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
