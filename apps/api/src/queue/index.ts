import { env } from '../config/env.js'
import { logger } from '../http/logger.js'
import { MemoryQueueDriver } from './memoryDriver.js'
import type { EnqueueOptions, JobHandler, QueueDriver } from './types.js'

let driver: QueueDriver | null = null

/**
 * Returns the configured queue driver (singleton), mirroring the storage seam.
 * Only the in-memory driver is implemented; asking for a durable driver fails
 * loudly rather than silently fabricating one.
 */
export function getQueue(): QueueDriver {
  if (driver) return driver
  if (env.QUEUE_DRIVER === 'memory') {
    driver = new MemoryQueueDriver({
      concurrency: env.QUEUE_CONCURRENCY,
      maxAttempts: env.QUEUE_MAX_ATTEMPTS,
      retryDelayMs: env.QUEUE_RETRY_DELAY_MS,
    })
    return driver
  }
  throw new Error(
    `[queue] the "${env.QUEUE_DRIVER}" driver is not implemented; set QUEUE_DRIVER=memory ` +
      '(a durable Postgres/Redis driver should be added for multi-instance deployments)',
  )
}

/** Registers a named job handler. Call once at boot, before `startQueue()`. */
export function registerWorker<P>(name: string, handler: JobHandler<P>): void {
  getQueue().register(name, handler)
}

/**
 * Enqueues a job. Never throws: a queue problem must not turn a successful request
 * into a 500, and enqueued work is idempotent/re-triggerable.
 */
export function enqueue<P>(name: string, payload: P, opts?: EnqueueOptions): void {
  if (!env.QUEUE_ENABLED) return
  try {
    getQueue().enqueue(name, payload, opts)
  } catch (err) {
    logger.error({ err, job: name }, '[queue] enqueue failed')
  }
}

export function startQueue(): void {
  if (!env.QUEUE_ENABLED) {
    logger.info('[queue] disabled (QUEUE_ENABLED=false)')
    return
  }
  getQueue().start()
}

export async function stopQueue(): Promise<void> {
  if (driver) await driver.stop()
}

export type { QueueDriver, JobHandler, EnqueueOptions } from './types.js'
