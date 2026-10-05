import { createApp } from './app.js'
import { env, assertProductionSecrets } from './config/env.js'
import { logger } from './http/logger.js'
import { prisma } from './db/prisma.js'
import { startQueue, stopQueue } from './queue/index.js'
import { registerMatchingWorkers } from './modules/career/matching.worker.js'

async function main(): Promise<void> {
  assertProductionSecrets()

  // Register background job handlers, then start the in-process worker.
  registerMatchingWorkers()
  startQueue()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'TR Life API listening')
  })

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully')
    server.close(async () => {
      await stopQueue()
      await prisma.$disconnect()
      process.exit(0)
    })
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server')
  process.exit(1)
})
