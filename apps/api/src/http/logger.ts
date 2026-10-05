import pino from 'pino'
import { env } from '../config/env.js'

/** Root structured logger. Child loggers add context (e.g. requestId). */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'tr-life-api', version: '0.1.0' },
  ...(env.LOG_PRETTY && !env.isProduction
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' },
        },
      }
    : {}),
})
