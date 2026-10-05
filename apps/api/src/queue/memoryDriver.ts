import { logger } from '../http/logger.js'
import type { EnqueueOptions, JobHandler, QueueDriver } from './types.js'

interface Task {
  id: number
  name: string
  payload: unknown
  attempts: number
  key?: string
}

export interface MemoryQueueOptions {
  concurrency?: number
  maxAttempts?: number
  retryDelayMs?: number
}

/**
 * In-process FIFO queue. Non-durable by design: pending work is lost on restart.
 * That is acceptable here because the jobs it runs (match recomputation) are
 * idempotent and are re-triggered by cache-staleness on the read path, so a lost
 * job only means the cache refreshes on the next request instead of immediately.
 */
export class MemoryQueueDriver implements QueueDriver {
  readonly name = 'memory'

  private readonly handlers = new Map<string, JobHandler<never>>()
  private queue: Task[] = []
  private readonly pendingKeys = new Set<string>()
  private readonly timers = new Set<NodeJS.Timeout>()
  private running = 0
  private started = false
  private nextId = 1
  private drainResolve: (() => void) | null = null

  private readonly concurrency: number
  private readonly maxAttempts: number
  private readonly retryDelayMs: number

  constructor(opts: MemoryQueueOptions = {}) {
    this.concurrency = opts.concurrency ?? 2
    this.maxAttempts = opts.maxAttempts ?? 3
    this.retryDelayMs = opts.retryDelayMs ?? 2000
  }

  register<P>(name: string, handler: JobHandler<P>): void {
    this.handlers.set(name, handler as JobHandler<never>)
  }

  enqueue<P>(name: string, payload: P, opts: EnqueueOptions = {}): void {
    if (opts.dedupeKey) {
      if (this.pendingKeys.has(opts.dedupeKey)) return
      this.pendingKeys.add(opts.dedupeKey)
    }
    const task: Task = { id: this.nextId++, name, payload, attempts: 0, key: opts.dedupeKey }
    if (opts.delayMs && opts.delayMs > 0) {
      this.schedule(() => this.push(task), opts.delayMs)
    } else {
      this.push(task)
    }
  }

  start(): void {
    if (this.started) return
    this.started = true
    logger.info({ driver: this.name, concurrency: this.concurrency }, '[queue] worker started')
    this.pump()
  }

  async stop(): Promise<void> {
    if (!this.started) return
    this.started = false
    for (const t of this.timers) clearTimeout(t)
    this.timers.clear()
    // Let in-flight handlers settle, but never hang shutdown forever.
    if (this.running > 0) {
      await Promise.race([
        new Promise<void>((resolve) => {
          this.drainResolve = resolve
        }),
        new Promise<void>((resolve) => this.schedule(resolve, 5000)),
      ])
    }
    this.queue = []
    this.pendingKeys.clear()
    logger.info({ driver: this.name }, '[queue] worker stopped')
  }

  private push(task: Task): void {
    this.queue.push(task)
    this.pump()
  }

  private schedule(fn: () => void, ms: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      fn()
    }, ms)
    timer.unref?.()
    this.timers.add(timer)
    return timer
  }

  private pump(): void {
    if (this.started) {
      while (this.running < this.concurrency && this.queue.length > 0) {
        const task = this.queue.shift() as Task
        if (task.key) this.pendingKeys.delete(task.key)
        this.running++
        void this.run(task)
      }
    }
    if (this.running === 0 && this.drainResolve) {
      const resolve = this.drainResolve
      this.drainResolve = null
      resolve()
    }
  }

  private async run(task: Task): Promise<void> {
    const handler = this.handlers.get(task.name)
    let retry = false
    try {
      if (!handler) {
        logger.warn({ job: task.name }, '[queue] no handler registered; dropping job')
      } else {
        await handler(task.payload as never)
      }
    } catch (err) {
      task.attempts++
      if (task.attempts < this.maxAttempts) {
        retry = true
        logger.warn({ job: task.name, attempt: task.attempts, err }, '[queue] job failed; retrying')
      } else {
        logger.error({ job: task.name, attempts: task.attempts, err }, '[queue] job failed permanently; dropping')
      }
    } finally {
      this.running--
      if (retry) this.schedule(() => this.push(task), this.retryDelayMs)
      this.pump()
    }
  }
}
