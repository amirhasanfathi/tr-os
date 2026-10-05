// Test bootstrap. Sets deterministic env fallbacks so modules that import
// `config/env.js` (which validates the environment at load time) can be imported
// by tests without a real `.env`. dotenv, loaded by env.ts, does NOT override
// variables that are already set, so these win during tests.
//
// This file MUST be imported before any module under test. Import it as the first
// line of every test file (`import './setup.js'`).
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://trlife:trlife@localhost:5432/trlife_test',
  JWT_ACCESS_SECRET: 'test-access-secret-0123456789abcdef',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcdef',
  STORAGE_SIGNING_KEY: 'test-storage-signing-key-0123456789',
  STORAGE_LOCAL_DIR: './.storage-test',
  LOG_LEVEL: 'error',
}

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) process.env[key] = value
}

export {}
