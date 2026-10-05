# TR Life OS — Frontend Prototype

> «زندگی در ترکیه، بدون حدس زدن قدم بعدی»
>
> Life OS for Iranian immigrants and expats in Turkey.

This is a **frontend-only prototype** with mock data. It is not a real immigration/legal service,
never guarantees residence, citizenship, employment or legal outcomes, and contains no fake
government integrations. All providers, jobs and tickets are fictional sample data (marked «نمونه داده»).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 — it redirects to `/dashboard`.
Try `/onboarding` for the first-time wizard and `/admin` for the admin surface (its statistics are computed
from data, not hardcoded, and the backing API routes require an ADMIN token).

## Tech stack

React 18 · TypeScript · Vite 5 · Tailwind CSS 4 · Lucide icons · Recharts · React Router 6.
Interface defaults to Persian + RTL with the Vazirmatn font, and ships with a lightweight
built-in i18n layer (فارسی / English / Türkçe). No backend, no extra dependencies.

## Project structure

```
src/
├── types/index.ts            # All domain interfaces (User, UserProfile, Document,
│                             #   Journey, JourneyStep, Job, JobSource, JobMatch, Skill,
│                             #   Language, Provider, CitizenshipPath, Ticket, Guide, Notification)
├── data/mockData.ts          # Single fictional data source (demo user علی رضایی)
├── i18n/
│   ├── index.tsx             # I18nProvider + useI18n (t / tList / setLocale / dir),
│   │                         #   locale persisted in localStorage, <html lang/dir> synced
│   └── locales/
│       ├── fa.ts             # Source of truth — exports the `Dict` type
│       ├── en.ts             # Full translation (typed as `Dict`)
│       └── tr.ts             # Partial (DeepPartial<Dict>) — falls back to en → fa
├── services/                 # Mock API layer — swap these for real APIs later
│   ├── authService.ts        #   getSession / login / logout
│   ├── profileService.ts     #   getUserProfile / updateUserProfile / getDashboardData
│   ├── jobService.ts         #   getJobs / getJobsBySource / toggleSaveJob / getJobSources / toJob
│   ├── careerService.ts      #   getMatchedJobs / getCareerSummary (deterministic engine mirror)
│   ├── journeyService.ts     #   getUserJourney / getNextActions / setTaskCompleted
│   ├── documentService.ts    #   getDocuments / updateDocumentStatus / uploadDocument
│   ├── citizenshipService.ts #   getCitizenshipPaths / getCitizenshipRoadmap (informational only)
│   ├── providerService.ts    #   getProviders / getProvidersByCategory / toProvider (price-band glyph)
│   ├── providerTrust.ts      #   computeTrustScore + priceBand (frontend mirror of the server
│   │                         #   trust engine, so mock mode derives scores instead of hardcoding)
│   ├── notificationService.ts#   getNotifications / markNotificationRead / markAllRead (dual-mode HTTP seam)
│   ├── contentService.ts     #   getTickets/createTicket (dual-mode HTTP seam) + getGuides / getHousingRisks
│   └── adapters/jobSourceAdapter.ts  # Prototype mock adapters (mock mode only, all
│                             #   `enabled: false`). The production integration seam is
│                             #   the backend registry in apps/api/src/modules/jobs/adapters/.
├── components/
│   ├── ui/                   # Lightweight component system (Card, Badge, Button,
│   │                         #   ProgressBar, Modal, Tabs, Checkbox, status badges)
│   ├── layout/               # AppLayout, Sidebar (240px), Topbar, MobileNav
│   ├── JobCard.tsx           # Opportunity card with match scores, save/apply
│   ├── SourceBadge.tsx       # Job source badges (LinkedIn, Kariyer.net, …)
│   ├── EmergencyModal.tsx    # «کمک فوری» with placeholder official resources
│   └── PageHeader.tsx / SampleDataBadge.tsx
└── pages/
    ├── Dashboard.tsx         # /dashboard — status, 3 next actions, journey strip, quick tools
    ├── Journey.tsx           # /journey/90-days — timeline, checklists, today tasks, map card
    ├── Career.tsx            # /career — Career OS, AI Match panel, skill chart, job matching
    ├── Opportunities.tsx     # /opportunities — source-filtered jobs + community opportunities
    ├── Citizenship.tsx       # /citizenship — informational roadmap, goal tabs, 30% status
    ├── Documents.tsx         # /documents — statuses, expiry dates, mock upload
    ├── Housing.tsx           # /housing — Rental Risk 32/100, risk checklist, expert review CTA
    ├── Services.tsx          # /services — categories, Trust Score, booking simulation
    ├── Guides.tsx            # /guides — guide cards with full detail modal
    ├── Tickets.tsx           # /tickets — ticket list + create (local mock)
    ├── Profile.tsx           # /profile — skill selection, scores
    ├── Settings.tsx          # /settings — notification toggles, language, about
    ├── Onboarding.tsx        # /onboarding — 6-step first-time wizard
    └── Admin.tsx             # /admin — admin surface (ADMIN-gated API; computed stats, no fake counts)
```

## Architecture

USER → PROFILE → STATUS → JOURNEY → NEXT ACTION → OPPORTUNITIES → SERVICES → LONG-TERM GOALS

- Components and pages **never import `mockData.ts` directly** — all data (including the career
  AI panel and emergency resources) flows through `services/*`, which return Promises, the same
  contract a real API client has. `authService` is already dual-mode: it switches to the HTTP API
  when `VITE_DATA_SOURCE=http` (see the backend seam below).
- The dashboard answers «what should I do next?» within one screen: current status card
  (72 days remaining), three prioritized next actions with deadlines and CTAs, journey strip,
  and quick tools.
- Job matching is deterministic and **computed, never hardcoded**: the server engine
  (`apps/api/src/modules/career/career.engine.ts`) scores skill/language overlap against the
  user's real profile; `careerService` mirrors the same engine for mock mode. Recommendations
  are stable profile-derived codes localized via `career.recs.*` — no fabricated AI output.
- Modular by design: adding a module = new route + new service file; nothing else changes.

## Internationalization (i18n)

A tiny custom i18n layer (no external dependency) lives in `src/i18n/`:

- **`useI18n()`** exposes `locale`, `setLocale`, `dir`, `t(key, vars?, fallback?)` and `tList(key)`.
  `t` supports dot-paths (`dashboard.nextStepTitle`) and `{var}` interpolation; `tList` returns
  string arrays (used by the onboarding option lists).
- **Fallback chain** is `locale → en → fa`. `fa.ts` is the source of truth and exports the `Dict`
  type; `en.ts` is a full `Dict`; `tr.ts` is a `DeepPartial<Dict>` so untranslated Turkish keys
  gracefully fall back to English (then Persian).
- **Direction & persistence:** switching locale updates `document.documentElement.lang`/`dir`,
  writes to `localStorage` (`trlife-locale`) and re-renders the whole tree. RTL/LTR is handled with
  Tailwind logical utilities (`border-e`, `ps-/pe-`, `text-start`) plus a few `dir`-aware branches.
- The language switcher is on **Settings → Language & display**.

**Adding a locale:** create `src/i18n/locales/<code>.ts` (typed `Dict` or `DeepPartial<Dict>`),
register it in the dictionary map and the `locales` array in `src/i18n/index.tsx`.

> **Note — data vs. UI strings.** Only UI chrome is localized. Mock *content* (job titles, guide
> bodies, provider names, journey steps, next-action text, AI recommendations, emergency resource
> details) stays Persian on purpose. Localizing that content is a data-layer concern that belongs to
> the future CMS/API integration points below, not the frontend dictionary.

## Future API integration points

| Service function | Future endpoint |
|---|---|
| `authService.login/getSession` | `POST /api/auth/*` (real auth) |
| `profileService.getUserProfile/getDashboardData` | `GET /api/profile`, `GET /api/dashboard` |
| `jobService.getJobs/getJobsBySource/toggleSaveJob/getJobSources` | `GET /api/v1/jobs` (`?source=&q=&limit=`), `POST /api/v1/jobs/:id/save`, `GET /api/v1/jobs/sources` (wired) — no scraping; `POST /api/v1/jobs/sources/:adapterKey/sync` is admin-only and gated on a registered adapter + enabled source |
| `careerService.getMatchedJobs/getCareerSummary` | `GET /api/v1/career/matches` (`?source=&q=&limit=`), `GET /api/v1/career/matches/:id`, `GET /api/v1/career/summary` (wired) — deterministic engine; a real CV-analysis model is a later, separate addition |
| `journeyService.getUserJourney/getNextActions/setTaskCompleted` | `GET /api/v1/journey`, `GET /api/v1/journey/next-actions`, `PATCH /api/v1/tasks/:id` (wired) |
| `documentService.getDocuments/uploadDocumentFile/getDownloadUrl` | `GET /api/v1/documents`, `POST /api/v1/documents/uploads` + signed PUT, `GET /api/v1/documents/:id/download` (wired) |
| `citizenshipService.*` | Rules/content API (must stay informational) |
| `providerService.getProviders/getProvidersByCategory` | `GET /api/v1/providers` (`?category=&limit=`), `GET /api/v1/providers/:id`, `GET /api/v1/providers/:id/reviews`, `POST /api/v1/providers/:id/reviews` (wired) — trust score computed server-side from verification + reviews; provider verify/status changes now live in the admin module (`PATCH /api/v1/admin/providers/:id/verification`, `.../status`) |
| `adminService.getAdminStats/getAuditTrail` | `GET /api/v1/admin/stats`, `GET /api/v1/admin/audit` (`?entityType=&limit=&offset=`) (wired) — ADMIN-gated; every stat is a real Prisma aggregate, mock mode derives from demo arrays («—» when no data backs it) |
| `notificationService.getNotifications/markNotificationRead/markAllRead` | `GET /api/v1/notifications` (`?limit=`), `POST /api/v1/notifications/:id/read`, `POST /api/v1/notifications/read-all` (wired) — own notifications only, from token. Realtime push/WebSocket is a later addition, not stubbed |
| `contentService.getTickets/createTicket` | `GET /api/v1/tickets` (`?limit=`), `POST /api/v1/tickets`, `GET /api/v1/tickets/:id`, `POST /api/v1/tickets/:id/messages` (wired) — own tickets only, ownership from token |
| `contentService.getGuides/getHousingRisks` | CMS / rental-risk analysis APIs (still mock-only — later phase) |

## Backend (`apps/api`) — production foundation

The prototype is being migrated to a production-ready stack **without changing the existing UI**.
The web app still lives at the repo root (`src/`); the backend is additive:

```
packages/shared/   # @tr-life/shared — dependency-free enums + typed DTOs (API contract)
apps/api/          # @tr-life/api — Node 22 + TS + Express + Prisma (PostgreSQL) modular monolith
docker-compose.yml # local PostgreSQL 16 + Adminer
```

**Request flow:** `route → validate(zod) → service → prisma`. Cross-cutting concerns are
middleware: `helmet`, `cors`, `pino-http` (structured logs + `x-request-id`), rate limiting,
JWT auth (`authenticate` / `authorize(...roles)`), and a central error handler that emits the
shared `ApiError` envelope. Health: `GET /health` (liveness) and `GET /ready` (readiness, checks DB).

**Security posture (P17 hardening):**
- *Authentication* — JWT access + refresh; `jsonwebtoken` is pinned to `HS256` on both sign and verify
  (`modules/auth/tokens.ts`), so algorithm-confusion (`alg:none`, key-type swaps) is rejected. Refresh
  carries a `tokenVersion` (`ver`); logout/password-change bump it to revoke issued refresh tokens. Login
  returns a uniform `Invalid email or password` for unknown email vs. wrong password (no user enumeration);
  passwords use bcrypt with a configurable, clamped cost. The only user shape that leaves the API is
  `toSessionUser` — never a password hash.
- *Authorization* — enforced server-side, never trusted from the client. Every business router runs
  `authenticate`; role gates (`authorize(Role.ADMIN, Role.SUPER_ADMIN)`) protect the whole admin surface and
  job writes. Resource ownership is always derived from `req.user.userId` and scoped into the query
  (`findFirst({ id, userId, deletedAt: null })` → 404), so a valid token for one user can never read or mutate
  another's rows; no handler takes a subject id from the body.
- *Input validation* — every route has a zod schema for `body`/`query`/`params`; `validate()` replaces the
  request parts with parsed output, which strips unknown keys (no mass-assignment) and coerces/bounds
  numbers. Pagination `limit`/`offset` are integer-bounded (max 100–200), strings are length-capped, and
  `orderBy`/`select` are always static field names — never client strings.
- *Uploads* — the client filename is metadata only. The storage key is server-generated and scoped to the
  owner (`documents/<userId>/<uuid>/<uuid>.<ext>`), the extension derives from an allowlisted MIME
  (pdf/jpeg/png), and size is enforced both on the declared `sizeBytes` and again while streaming the PUT.
  Local keys are resolved through a containment check that rejects `..`/absolute traversal, and files are
  served back as opaque `application/octet-stream` + `Content-Disposition: attachment`.
- *Transport & secrets* — `helmet`, a CORS origin **allowlist** (no wildcard under `credentials`), JSON body
  capped at 1 MB, `trust proxy` only in production, and tiered rate limiting (`authLimiter` on credential
  endpoints, a global `apiLimiter`). `pino-http` redacts `authorization`, `cookie` and `set-cookie` so
  bearer tokens never reach logs. Config is validated once at boot and fails fast; `.env`/`.env.*` are
  gitignored (only `.env.example` with placeholder secrets is tracked) and `assertProductionSecrets()`
  refuses to start in production on placeholder JWT/storage-signing secrets.
- *Responses* — the central error handler never leaks stack traces, SQL, or dependency internals; 5xx
  messages are collapsed to `Internal server error` in production. Audit entries deliberately omit the raw
  `before`/`after` payloads from the admin DTO to avoid echoing sensitive JSON.

**Endpoints so far** (all under `/api/v1`): `POST /auth/register|login|refresh|logout`,
`GET /auth/me`, `GET|PATCH /profile` (private), the private documents module
`GET /documents`, `POST /documents/uploads`, `GET /documents/:id`, `POST /documents/:id/complete`,
`GET /documents/:id/download`, `DELETE /documents/:id`, the private journey module
`GET /journey`, `GET /journey/next-actions`, `PATCH /tasks/:id`, and the private jobs module
`GET /jobs` (filter `?source=&q=&limit=`), `GET /jobs/:id`, `POST /jobs/:id/save`,
`GET /jobs/sources`, `POST /jobs/sources/:adapterKey/sync` (admin), the private career module
`GET /career/matches` (filter `?source=&q=&limit=`), `GET /career/matches/:id`, `GET /career/summary`,
and the private providers module `GET /providers` (filter `?category=&limit=`), `GET /providers/:id`,
`GET /providers/:id/reviews`, `POST /providers/:id/reviews`, the private tickets module
`GET /tickets` (filter `?limit=`), `POST /tickets`, `GET /tickets/:id`, `POST /tickets/:id/messages`,
and the private notifications module `GET /notifications` (filter `?limit=`),
`POST /notifications/:id/read`, `POST /notifications/read-all`, and the admin module
`GET /admin/stats`, `GET /admin/audit` (filter `?entityType=&limit=&offset=`),
`PATCH /admin/providers/:id/verification`, `PATCH /admin/providers/:id/status`,
`PATCH /admin/tickets/:id/triage` (all gated on an ADMIN/SUPER_ADMIN token via `authorize`).
The profile response returns
canonical ISO timestamps plus a server-computed `derived` block (days/months remaining, journey day,
residence progress) — no relative date strings and no client-writable scores. New modules mount in
`apps/api/src/app.ts`.

**Journey engine (server-owned):** the 90-day plan is template content (`JourneyTemplate` →
`JourneyStep`, each with a stable `key` and CTA) plus per-user state (`UserJourneyStep`, and `Task`
rows that are either a step checklist item or a standalone today-task). The server computes the
current day (from `residenceStartedAt`), each step's status and `daysUntilDue`, ranks the next
actions deterministically (in-progress first, then upcoming by day), and derives residence progress
(done/total steps) — no relative-date strings, no hardcoded scores, and no business rules in React.
`PATCH /tasks/:id` takes ownership from the token, never the body.

**Jobs + adapter seam (no fabricated integrations):** jobs are stored rows sourced from a
`JobSource`; the API serves them with a per-user `saved` flag (ownership from the token) and never
computes match scores here — scoring belongs to the career matching engine below. External
ingestion is a typed seam (`modules/jobs/adapters/`): a `JobSourceAdapter` interface plus a registry
that is **intentionally empty**. `POST /jobs/sources/:adapterKey/sync` (admin-only) refuses with a
409 unless an adapter is registered **and** its `job_sources` row is `enabled` (seeded `false`), so
the API can never imply a live sync that does not exist. Scraping is not permitted and no source is
stubbed. `GET /jobs/sources` reports truthful integration status, which the Opportunities page shows
instead of mock data when running in HTTP mode.

**Deterministic matching engine (no AI, no hardcoded scores):** `modules/career/career.engine.ts`
is a set of pure functions — no I/O, no model calls. `computeJobMatch` scores a job against the
user's real profile from skill overlap (normalized both-way substring match) and required language,
capped so a listing can never claim a false 100%; `computeCareerScore`, `computeSkillMatch` and
`deriveRecommendations` likewise derive every value from stored skills, languages, experience and
address-registration state. `career.service.ts` loads the profile, ranks matched jobs, and upserts
each result into `job_matches` with a `computedAt` stamp (so `job_matches` is never seeded — it is
always computed). Recommendations are returned as **stable codes** (`turkish_b1`, `english_b2`,
`skills_breadth`, `experience`, `address_registration`); the client localizes them via
`career.recs.*`, so no fabricated "AI" copy is baked into the contract. The frontend `careerService`
mirrors the exact same engine for mock mode, keeping prototype numbers consistent with the API.

**Background job queue (recompute off the request path):** `GET /career/matches` no longer recomputes
inline. It serves from the cached `job_matches` rows and applies **stale-while-revalidate**: a cold
cache is bootstrapped once inline (so the first load is never empty), while a stale/incomplete cache
(`computedAt` older than `MATCH_CACHE_TTL_MS`, or a listing with no row yet) is returned as-is and a
`career.recompute-user-matches` job is enqueued to refresh it in the background. Profile updates
enqueue the same job, so scores track the user's real data without blocking writes. The queue lives in
`src/queue/` behind a driver seam that mirrors object storage: `QueueDriver` interface +
`getQueue()`/`enqueue()`/`registerWorker()`/`startQueue()`/`stopQueue()`. Only the **in-memory** driver
ships (`QUEUE_DRIVER=memory`, default); a durable Postgres/Redis driver is the right choice for
multi-instance deployments and is intentionally **not** fabricated — `getQueue()` throws if one is
requested. In-memory is safe here because recompute is idempotent and re-triggered by cache staleness,
so a job lost on restart simply refreshes on the next request. The worker runs in-process (started in
`server.ts`, drained on shutdown — no separate microservice), with bounded concurrency, per-key
dedupe (a burst of edits → one recompute), and capped retries. `enqueue()` never throws: a queue fault
cannot turn a good request into a 500.

**Provider trust pipeline (earned, never hardcoded):** `providers.trustScore` is a **cache**, not the
source of truth. `modules/providers/trust.engine.ts` is a pure function of real signals only — an admin
`verified` flag plus the provider's review ratings — using a Bayesian average (a neutral 3.5★ prior
weighted as 3 pseudo-reviews) scaled by review-volume confidence, so a single 5★ review cannot inflate a
score and a provider with no reviews earns no review-based trust. The result is capped below 100 (a
score is evidence, not a guarantee of quality or outcome). `recomputeProviderTrust` re-derives and
stores it whenever a review is added (low-frequency writes → synchronous, no queue). Review authorship
comes from the token, never the body, and reviewer PII is omitted from the wire DTOs. The seed does not
hardcode scores either: it imports the same engine and derives each provider's score from its seeded
review rows; the frontend `providerTrust.ts` mirrors the engine so mock mode agrees exactly. Provider
verification/status changes belong to the admin module (a later phase) and are not exposed here.

**Support tickets (own-scope, token-derived):** `modules/tickets/` lists, reads (with messages),
creates, and appends messages to a user's **own** tickets only — `findFirst({ id, userId })` so a
ticket the caller doesn't own is reported as not-found (existence is never leaked). The client sends
only content (`subject`, optional `category`/first `body`); `status` starts at `open` and `priority` at
`medium` server-side, and message authorship is the token user — none of it is taken from the body
(triage/status changes are a later staff/admin phase). The human `code` (`#PN-…`) is generated by the
server with a bounded retry on the DB unique constraint, not by the client. The prototype's
`nextAction` free-text had no backing column, so it was removed rather than fabricated: the UI now
derives the «قدم بعدی» hint from `status` via i18n (`tickets.nextOpen|nextWaiting|nextInProgress|nextResolved`),
keeping the label a presentation concern. Ticket attachment bytes stay in object storage (schema already
models `storageKey`); an upload endpoint is deferred until the UI needs it.

**Notifications (own-scope, request/response):** `modules/notifications/` lists a user's own
notifications newest-first and marks one/all read (`findFirst({ id, userId })` + `updateMany({ userId,
read:false })`, stamping `readAt`). Ownership is token-derived; nothing is taken from input and other
users' rows are never leaked. The Topbar's unread badge is **derived from the returned data** (count of
`!read`), never a hardcoded number. This phase intentionally ships only the read seam — realtime
push/WebSocket delivery is a concrete later addition and is **not** stubbed or faked; the service's read
helpers refetch after the POST so the UI reflects server truth rather than an optimistic guess.

**Admin dashboard (computed stats) + audit (ADMIN-gated):** `modules/admin/` replaces the prototype's
hardcoded fake counts (`1,248 / 312 / …`) with **real aggregates** — every figure on `GET /admin/stats`
is a Prisma `.count()` over actual rows, so nothing is fabricated. `GET /admin/audit` pages the
`AuditLog` table and intentionally does **not** expose the raw `before`/`after` JSON (it can hold
sensitive data) — only action metadata (action, entity, actor name, request id, timestamp). The
verification/status transitions deferred from the providers and tickets modules now live here
(`PATCH /providers/:id/verification`, `PATCH /providers/:id/status`, `PATCH /tickets/:id/triage`);
each one writes an audit row through a single service-layer helper (`audit.ts`) whose actor, request id
and IP come from the **verified token and request, never the body**, and toggling `verified` recomputes
the trust score. The whole router is mounted behind `authenticate` + `authorize(Role.ADMIN,
Role.SUPER_ADMIN)`: no token → 401, a non-admin token → 403 (verified). The frontend `Admin.tsx` now
reads through the seam (`adminService.getAdminStats`) — in HTTP mode it shows server counts, in mock mode
it derives them from the actual demo datasets and renders «—» where no data backs a number (e.g. total
users) rather than inventing one.

**Object storage (two drivers):** file bytes never touch PostgreSQL — the DB stores only metadata plus a
server-generated `storageKey`. Uploads are a three-step signed flow: the client asks `POST /documents/uploads`
for a ticket, PUTs the bytes to the returned signed URL, then calls `POST /documents/:id/complete`. Storage
keys are opaque and derived from the owner + a UUID, the file extension comes from an allowlisted MIME type
(PDF/JPEG/PNG), and the client-supplied filename is kept as metadata only — never used to build a path.
`STORAGE_DRIVER=local` signs the URL as an HMAC over `<op>:<key>.<exp>` and serves bytes through the app's
unversioned `/storage` router (dev / single-box with a mounted volume). `STORAGE_DRIVER=s3` is a real
S3-compatible driver (`storage/s3Driver.ts`, AWS SDK v3 + SigV4 presigner) used for production and for
**Supabase Storage** via its S3-compatible endpoint — the browser PUTs/GETs presigned URLs that point
*directly at the provider*, so no bytes transit the API and no local disk is required. The presigner runs
entirely offline (URL signing is a local computation), and a presigned GET overrides the response to
`application/octet-stream` + `attachment`, mirroring the local router's "never trust a stored content type"
stance. `createSigned*Url` are async (Promise) so both drivers share one `StorageDriver` contract;
`config/env.ts` fails the boot fast if `STORAGE_DRIVER=s3` lacks bucket/region/access/secret. Covered by an
offline, deterministic test (`test/storage.s3.test.ts`: presigned PUT/GET shape + traversal-key rejection).

### Run the API locally

```bash
docker compose up -d db          # PostgreSQL 16 on :5432 (trlife/trlife/trlife)
cd apps/api
cp .env.example .env             # dev secrets; NEVER commit a real .env
npm install
npm run prisma:migrate           # apply migrations (prisma/migrations/0_init)
npm run db:seed                  # load the dev dataset (replaces mockData as source of truth)
npm run dev                      # tsx watch → http://localhost:4000
```

Seeded dev logins (password `Passw0rd!demo`): `ali.rezaei@example.com` (USER) and
`admin@example.com` (ADMIN). The seed is idempotent — it wipes and re-creates in FK order.

### Design rules enforced in the data layer

- **No relative/human-readable dates in the DB.** Every deadline/expiry is a real `timestamptz`;
  the UI derives «days remaining» from it.
- **No hardcoded matching scores.** `job_matches` is never seeded — scores are computed by the
  deterministic engine and cached with a `computedAt` stamp; recomputation runs in a background queue
  (stale-while-revalidate), never inline on every request. `careerScoreCache` starts null.
- **No hardcoded trust scores.** `providers.trustScore` is a cache derived from real signals
  (verification + reviews) by the pure trust engine; the seed and the frontend both compute it rather
  than storing a fabricated number, and it is capped below 100 so it never implies a guarantee.
- **Files are never stored in Postgres.** `documents` / `ticket_attachments` hold a `storageKey`
  pointing at object storage (seed keys are placeholders; no bytes are uploaded).
- **No fabricated admin statistics.** The admin dashboard shows only server-computed `count()`
  aggregates (HTTP) or values derived from the real demo arrays (mock); where nothing backs a number the
  UI shows «—» instead of inventing one. The old hardcoded `1,248 / 312 / 47 / …` counts are gone.
- **No fabricated integrations.** `job_sources.enabled` is `false` until a real adapter is wired.
- **Scores/caches are recomputed server-side**, never trusted from the client.

### Frontend ⇄ backend seam

`src/config/runtime.ts` exposes `runtimeConfig.dataSource` (`'mock' | 'http'`, via `VITE_DATA_SOURCE`)
and `apiUrl`. `src/services/httpClient.ts` is a typed client with a token store and transparent
`401 → refresh → retry`. Services flip from mock to HTTP behind this flag, so the migration is
incremental and the UI is preserved.

**Dates & numbers (presentation-only, P15):** the API stores and returns real ISO timestamps and
numbers; every UI date/number goes through one formatter, `src/lib/format.ts`. For the Persian UI it
uses `Intl` with the Solar Hijri (`fa-IR-u-ca-persian`) calendar and Persian digits; `en`/`tr` use their
own calendar and Latin digits — formatting is locale-aware, never hardcoded. `interpolate()` in the i18n
layer also flips Latin digits to Persian in `fa`, so server numbers shown through a translation key
(`{days}`, progress, scores) localize automatically. Relative countdowns («۷۲ روز مانده», days-until-due)
are computed from real timestamps server-side and only ever *formatted* here — no relative date string is
stored and none is fabricated. The service `dateLabel` seams (notifications, tickets, documents, jobs,
journey, profile) and the admin stat counts now route through this util instead of `iso.slice(...)`.

**i18n polish (P16):** display labels are owned by the i18n dictionaries, not the components or services.
The status enum no longer carries a hardcoded Persian `statusLabel` (the dead field was dropped from
`UserProfile`, `profileService` and mock data — the UI reads `statuses.*` by enum value). Leftover English
UI strings (Career/CV/Trust scores, Skills match, Citizenship progress, Verified/Unverified, the emergency
source tag, Rental Risk) now route through translation keys; `fa`/`en` stay in lockstep (`en: Dict`) and
`tr` (DeepPartial) adds the shared labels with `en`→`fa` fallback for the rest. `level === 'Verified'` remains
a data comparison against the enum value, never a label. Score *numerals* keep their existing `latin` styling
so the visual layout is unchanged — only the surrounding label text is localized.

## Testing (P18)

The API suite runs on Node's built-in `node:test` runner + `node:assert/strict`, executed through `tsx`
so the same ESM/NodeNext TS files under `apps/api/src/` can be imported directly. No new test framework
dependency was added; the existing TypeScript config stays authoritative.

```bash
cd apps/api
npm test              # node --import tsx --test "test/**/*.test.ts"
npm run test:types    # tsc -p tsconfig.test.json --noEmit  (strict typecheck of src + test)
```

`tsconfig.test.json` extends the build tsconfig but adds `test/` to `include`, so tests are typechecked
under the same `strict` / `noUnusedLocals` / `noImplicitOverride` settings as production code without
ever emitting into `dist/`. Every test file imports `test/setup.js` first — it sets safe defaults for
`DATABASE_URL`, JWT secrets, `STORAGE_SIGNING_KEY`, and `STORAGE_LOCAL_DIR` (a `.storage-test/` sandbox)
so no real credentials are required to run the unit suite.

What is covered (all deterministic, no network, no live DB):
- **`career.engine.test.ts`** — job-match cap + determinism, zero-overlap base score, language tiers
  (فارسی/انگلیسی/other = 90/72/60), career score bounded 0..100 and monotonic in experience, skill
  bars mirror stored proficiency, recommendation `done` flag flips only when the real gap closes.
- **`trust.engine.test.ts`** — neutral base without verification, bounded verification bonus, cap at 98
  even with 1000 five-star inputs, Bayesian shrinkage so a single 5★ review cannot inflate the score,
  monotonic in evidence quality, byte-for-byte determinism on identical inputs, `averageRating` null
  vs. one-decimal mean.
- **`tokens.test.ts`** — header pins `HS256`, valid round-trip preserves `sub`/`role`/`ver`, forged
  `alg:none` rejected, wrong-secret rejected, expired rejected, TTL parsed from the configured duration.
- **`storage.test.ts`** — HMAC signature verifies for its own operation + payload; expired, tampered,
  and cross-operation replays (`get:` sig used as `put:`) all rejected; empty/non-numeric `exp` safe;
  `resolveKey` keeps ordinary nested keys inside the storage root and rejects `..` parent-directory
  traversal.
- **`http.middleware.test.ts`** — `validate()` strips unknown keys and applies coercion/defaults, a bad
  field emits a 422 with `body.<field>` details; `authenticate` 401s on missing/garbage tokens and only
  populates `req.user` from the verified JWT (never from the body); `authorize` 401s unauthenticated and
  403s on role mismatch; `toErrorEnvelope` maps `HttpError`, `ZodError`, Prisma `P2002`/`P2025`, and
  unexpected `Error` to stable codes with the `x-request-id` echoed.
- **`integration.test.ts`** — one DB-backed test (cross-user ticket read returns 404 for the non-owner
  and succeeds for the owner) **skipped by default**; enable with `RUN_DB_TESTS=1` alongside a live
  Postgres instance. Skipping in the sandbox is truthful — no fabricated pass is claimed for the DB path.

Current status: 36 pass / 1 skipped / 0 failed, and `npm run test:types` is green under `strict`.

## Deployment & CI (P19)

Production-shaped, containerized delivery **without changing the app** — the images reuse the same
`npm run build` and `node dist/server.js` entry points. The build context is always the repo root so
the API can reach its `file:../../packages/shared` dependency.

| Artifact | Purpose |
|---|---|
| `apps/api/Dockerfile` | Multi-stage API: build (shared → `prisma generate` → `tsc` → unit tests → prune) then a slim `node:22-slim` runtime that runs as a **non-root** user and ships only production deps. |
| `apps/api/docker-entrypoint.sh` | Runs `prisma migrate deploy` on boot when `RUN_MIGRATIONS=true` (default), then `exec`s the server. Fail-fast: the server never starts against a half-migrated schema. |
| `Dockerfile` (root) | Multi-stage Web: Vite build → `nginx:1.27-alpine` static host. `VITE_DATA_SOURCE`/`VITE_API_URL` are **build args** (Vite bakes them). |
| `nginx.conf` | SPA static serving: content-hashed `/assets/*` cached immutably, `index.html` always revalidated, `/` falls back to `index.html` for client-side routing, `/healthz` liveness probe, gzip + `server_tokens off`. |
| `.dockerignore` | Keeps `node_modules`, `dist`, `.env*`, `.storage*`, logs and `.git` out of the build context. |
| `docker-compose.yml` | **Unchanged** dev infra — Postgres 16 + Adminer (`docker compose up -d db`). |
| `docker-compose.prod.yml` | Full stack: `db` (healthchecked) → `api` (waits on `db` healthy, env-driven secrets, `/data/storage` volume) → `web` (nginx). |
| `.github/workflows/ci.yml` | CI: `api` job (shared build → prisma generate → typecheck → test:types → test → build), `web` job (typecheck + Vite build), `docker` job (builds both images, **never pushes**). |

**Build & run**

```bash
cp .env.example .env                       # then fill real secrets — NEVER commit .env
# docker-compose.prod.yml requires: POSTGRES_PASSWORD, JWT_ACCESS_SECRET,
# JWT_REFRESH_SECRET, STORAGE_SIGNING_KEY (it fails fast if any is missing).

# Single images (repo root is the context for both):
docker build -f apps/api/Dockerfile -t trlife-api .
docker build -t trlife-web --build-arg VITE_DATA_SOURCE=http --build-arg VITE_API_URL=https://api.example.com .

# Whole stack:
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

**Migrations** — `prisma migrate deploy` runs automatically at API boot (`RUN_MIGRATIONS=true`). On a
multi-replica deployment set it to `false` and run the migrations once as a dedicated job/CI step, so
replicas don't race each other to migrate. The seed (`npm run db:seed`) is a **dev** data loader and is
intentionally **not** run by the production entrypoint — it would wipe and re-create rows.

**Config & secrets** — the API validates config once at boot (`config/env.ts`) and `assertProductionSecrets()`
refuses placeholder JWT/storage-signing secrets under `NODE_ENV=production`. Compose injects everything
through `environment`; `.env` is consumed by the CLI only, never copied into an image (`.dockerignore`).

**Observability (honest scope)** — what actually exists: structured JSON logging via `pino-http` with a
per-request `x-request-id` echoed end-to-end and `authorization`/`cookie`/`set-cookie` redacted (P17);
`GET /health` (liveness, no DB) and `GET /ready` (readiness — returns 503 when the DB is unreachable);
`/healthz` for the web container; both images declare a `HEALTHCHECK`. Metrics and distributed tracing
(Prometheus/OpenTelemetry) are **deliberately not stubbed** — adding an endpoint that only pretends to
export real numbers would violate the project's no-fabricated-integrations rule, so it is left as a
concrete, clearly-scoped follow-on task rather than faked here.

> **Note:** the sandbox where this was authored has **no Docker engine**, so the images and the compose
> stack were **not** built/run here. The Dockerfiles, `nginx.conf`, `docker-entrypoint.sh` and the CI
> workflow are validated by (a) the same `npm run build` / `npm test` / `npm run typecheck` commands the
> images invoke, which all pass locally, and (b) the `docker` CI job, which is the first place the images
> are actually built. No deployment or image push was performed — that stays an operator action.
>
> For end-to-end deploy, see **[`DEPLOY.md`](./DEPLOY.md)**. It covers two topologies:
> **A — Vercel (web) + Supabase Postgres (DB) + one always-on service for the API** (`vercel.json` is
> included; recommended if you already use Vercel/Supabase — no code rewrites, just `DATABASE_URL` +
> public URLs), and **B — single-box Docker Compose** (`docker-compose.prod.yml`). The API is a
> long-running Node monolith (in-process queue + local-disk storage), so it belongs on an always-on host,
> not serverless; Supabase is used as managed Postgres only and the app keeps its own bcrypt/JWT auth.

## Disclaimer

Prototype with simulated backend. Citizenship and immigration content is informational only and
guarantees nothing. Emergency resources are placeholders — no invented phone numbers.
