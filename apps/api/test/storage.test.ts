import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSignature, verifySignature } from '../src/storage/signing.js'
import { resolveKey } from '../src/storage/localDriver.js'

// Signed-URL auth + local storage key resolution are the file-access trust
// boundary: a signature must be verifiable, expire, and be scoped to one
// operation, and a key must never escape the storage root.

const KEY = 'documents/u1/abc/abc.pdf'

test('a fresh signature verifies for its own operation and payload', () => {
  const { exp, sig } = createSignature(`get:${KEY}`, 300)
  assert.equal(verifySignature(`get:${KEY}`, exp, sig), true)
})

test('an expired signature is rejected', () => {
  const { exp, sig } = createSignature(`get:${KEY}`, -10)
  assert.equal(verifySignature(`get:${KEY}`, exp, sig), false)
})

test('a tampered signature is rejected', () => {
  const { exp, sig } = createSignature(`get:${KEY}`, 300)
  assert.equal(verifySignature(`get:${KEY}`, exp, sig.slice(0, -2) + 'xx'), false)
})

test('a download signature cannot be replayed as an upload (op is bound in)', () => {
  const { exp, sig } = createSignature(`get:${KEY}`, 300)
  assert.equal(verifySignature(`put:${KEY}`, exp, sig), false)
})

test('missing or malformed signature inputs are rejected safely', () => {
  const { exp } = createSignature(`get:${KEY}`, 300)
  assert.equal(verifySignature(`get:${KEY}`, exp, ''), false)
  assert.equal(verifySignature(`get:${KEY}`, 'not-a-number', 'abcdef'), false)
})

test('resolveKey keeps ordinary nested keys inside the storage root', () => {
  const path = resolveKey('documents/u1/abc/abc.pdf')
  assert.ok(path.replace(/\\/g, '/').includes('.storage-test/documents/u1'))
})

test('resolveKey rejects parent-directory traversal', () => {
  assert.throws(() => resolveKey('a/../../outside'))
  assert.throws(() => resolveKey('../../etc/passwd'))
})
