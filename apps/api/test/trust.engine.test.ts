import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeTrustScore, averageRating } from '../src/modules/providers/trust.engine.js'

// The trust engine is deterministic business logic (no I/O, no AI). These tests
// pin its invariants: evidence-only scoring, Bayesian shrinkage, and the "never a
// perfect 100" cap so a score is treated as evidence, not a guarantee.

test('no reviews yields neutral base; verification adds a real but bounded bonus', () => {
  assert.equal(computeTrustScore(false, []), 20)
  assert.equal(computeTrustScore(true, []), 45)
})

test('score is capped at 98 and never implies a guarantee', () => {
  const overwhelming = computeTrustScore(true, Array(1000).fill(5))
  assert.ok(overwhelming <= 98)
  assert.equal(overwhelming, 98)
})

test('a single 5-star review cannot inflate the score (Bayesian prior weight)', () => {
  const oneFive = computeTrustScore(true, [5])
  const noReview = computeTrustScore(true, [])
  // Review points are heavily discounted at n=1 — far short of the 55-point max.
  assert.ok(oneFive - noReview < 55)
})

test('higher ratings score higher (monotonic in evidence quality)', () => {
  assert.ok(computeTrustScore(true, [1]) < computeTrustScore(true, [5]))
})

test('same inputs always produce the same score', () => {
  assert.equal(computeTrustScore(true, [4, 5, 3]), computeTrustScore(true, [4, 5, 3]))
})

test('averageRating returns null with no reviews, else a one-decimal mean', () => {
  assert.equal(averageRating([]), null)
  assert.equal(averageRating([4, 5]), 4.5)
  assert.equal(averageRating([3, 3, 4]), 3.3)
})
