import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

/**
 * PrismaClient singleton. In dev, tsx watch reloads modules on change; caching
 * the client on globalThis prevents exhausting the DB connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['error', 'warn'],
  })

if (!env.isProduction) globalForPrisma.prisma = prisma

/** Verify DB connectivity (used by the readiness probe). */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
