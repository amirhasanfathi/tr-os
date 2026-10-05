import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../src/db/prisma.js'
import * as auth from '../src/modules/auth/auth.service.js'
import * as tickets from '../src/modules/tickets/tickets.service.js'
import { HttpError } from '../src/http/errors.js'

// Integration test for the token-scoped ownership guarantee. This sandbox has no
// PostgreSQL, so it is skipped by default. Enable it on a machine/CI with a real
// database:
//   RUN_DB_TESTS=1 DATABASE_URL=postgresql://... npm run test
//
// Importing prisma above does not open a connection, so this file is safe to load
// even when skipped.
const enabled = process.env.RUN_DB_TESTS === '1'

test(
  'a user cannot read another user’s ticket (cross-user reads are not-found, never a leak)',
  { skip: !enabled },
  async () => {
    const stamp = Date.now()
    const alice = await auth.register({ email: `alice+${stamp}@example.com`, fullName: 'Alice', password: 'Sup3rSecret!' })
    const bob = await auth.register({ email: `bob+${stamp}@example.com`, fullName: 'Bob', password: 'Sup3rSecret!' })

    try {
      const created = await tickets.createTicket(alice.user.id, { subject: 'Private matter' })

      await assert.rejects(
        () => tickets.getTicket(bob.user.id, created.id),
        (e: unknown) => e instanceof HttpError && e.status === 404,
      )

      const own = await tickets.getTicket(alice.user.id, created.id)
      assert.equal(own.id, created.id)
    } finally {
      try {
        await prisma.ticket.deleteMany({ where: { userId: { in: [alice.user.id, bob.user.id] } } })
        await prisma.user.delete({ where: { id: alice.user.id } })
        await prisma.user.delete({ where: { id: bob.user.id } })
      } catch {
        // Best-effort cleanup only; never mask the assertions above.
      }
      await prisma.$disconnect()
    }
  },
)
