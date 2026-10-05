/**
 * Background job queue abstraction.
 *
 * Mirrors the storage driver seam: callers depend on this interface, and a driver
 * is selected by config. Work that should not block a request (e.g. recomputing a
 * user's job matches) is enqueued here and processed by an in-process worker.
 *
 * Only an in-memory driver ships today. A durable Postgres/Redis driver can be
 * added behind the same interface for multi-instance deployments without touching
 * callers — it is deliberately not stubbed/fabricated here.
 */

export interface EnqueueOptions {
  /**
   * Coalesce duplicates: if a job with this key is already waiting to run, the new
   * enqueue is dropped. Used so a burst of profile edits triggers one recompute.
   */
  dedupeKey?: string
  /** Delay before the job becomes eligible to run, in milliseconds. */
  delayMs?: number
}

export type JobHandler<P = unknown> = (payload: P) => Promise<void> | void

export interface QueueDriver {
  readonly name: string
  register<P>(name: string, handler: JobHandler<P>): void
  enqueue<P>(name: string, payload: P, opts?: EnqueueOptions): void
  start(): void
  stop(): Promise<void>
}
