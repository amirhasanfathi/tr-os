import './setup.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeJobMatch,
  computeCareerScore,
  computeSkillMatch,
  deriveRecommendations,
  type EngineProfile,
} from '../src/modules/career/career.engine.js'

// Deterministic matching/career scoring. These lock the invariants the product
// depends on: scores derive from real profile+job data, are capped (never a
// guarantee), and are reproducible for identical inputs.

const profile: EngineProfile = {
  skills: [
    { name: 'UI/UX', level: 80 },
    { name: 'Figma', level: 70 },
  ],
  languages: [
    { name: 'فارسی', level: 'Native' },
    { name: 'ترکی', level: 'Beginner' },
  ],
  yearsOfExperience: 3,
  addressRegistered: false,
}

test('job match never exceeds its cap and is fully deterministic', () => {
  const perfect = computeJobMatch(
    { ...profile, skills: [{ name: 'UI/UX', level: 99 }, { name: 'WordPress', level: 99 }] },
    { id: 'x', skills: ['UI/UX', 'WordPress'], languages: ['فارسی'] },
  )
  assert.ok(perfect.score <= 85)
  assert.deepEqual(computeJobMatch(profile, { id: 'a', skills: ['UI/UX'], languages: ['فارسی'] }), computeJobMatch(profile, { id: 'a', skills: ['UI/UX'], languages: ['فارسی'] }))
})

test('zero skill overlap scores exactly the base', () => {
  const none = computeJobMatch(profile, { id: 'y', skills: ['PHP'], languages: ['انگلیسی'] })
  assert.equal(none.skillsScore, 45)
  assert.deepEqual(none.reasons, [])
})

test('language score is derived from the job requirement, in fixed tiers', () => {
  assert.equal(computeJobMatch(profile, { id: 'a', skills: ['x'], languages: ['فارسی'] }).languageScore, 90)
  assert.equal(computeJobMatch(profile, { id: 'b', skills: ['x'], languages: ['انگلیسی'] }).languageScore, 72)
  assert.equal(computeJobMatch(profile, { id: 'c', skills: ['x'], languages: ['Deutsch'] }).languageScore, 60)
})

test('career score is bounded 0..100 and rises with experience', () => {
  const low = computeCareerScore({ ...profile, yearsOfExperience: 1 })
  const high = computeCareerScore({ ...profile, yearsOfExperience: 8 })
  assert.ok(low >= 0 && high <= 100)
  assert.ok(high >= low)
})

test('skill-match bars mirror real proficiency, sorted descending', () => {
  const bars = computeSkillMatch(profile)
  assert.deepEqual(bars.map((b) => b.skill), ['UI/UX', 'Figma'])
  assert.equal(bars[0].match, 80)
})

test('recommendations flip "done" only when the real gap closes', () => {
  const before = deriveRecommendations(profile).find((r) => r.code === 'address_registration')
  const after = deriveRecommendations({ ...profile, addressRegistered: true }).find((r) => r.code === 'address_registration')
  assert.equal(before?.done, false)
  assert.equal(after?.done, true)
})
