# TR Life OS — Production deployment runbook

Two supported topologies. Pick one:

- **A — Vercel (web) + Supabase Postgres (DB) + one always-on service (API)** ← simplest with your
  existing tooling; **needs no code rewrites**. Recommended. See below.
- **B — Single-box Docker Compose** (one VM runs `db` + `api` + `web`). See [§0 onwards](#0-prerequisites).

---

## A. Vercel + Supabase + always-on API (recommended for your stack)

The app was built as a **long-running Node monolith** (in-process worker queue + local-disk storage),
so the API runs best on an always-on host, not serverless. Vercel serves the SPA, Supabase provides
managed Postgres, and the Express API runs unchanged as one container/service. Only `DATABASE_URL`
and the public URLs change versus local — no source edits.

### A.1 Database — Supabase Postgres

Create a project, then **Project Settings → Database → Connection string → Session pooler** (port `5432`).
Use the Session pooler, *not* the Transaction pooler (`6543`): Prisma uses prepared statements, and the
transaction pooler forces `pgbouncer=true` + disabling them. A single always-on server pooling directly
to the Session pooler is the correct setup.

```
DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres?schema=public
```

Notes:
- Our own **app-level auth** (bcrypt + JWT in the `users` table) stays — you do **not** need Supabase Auth.
  Supabase is used purely as managed Postgres.
- Prisma talks to the `public` schema (default). Migrations apply automatically at API boot (§A.3),
  or run them once yourself: `cd apps/api && npx prisma migrate deploy`.
- Turn off Supabase auto-SSL mismatch by keeping `?sslmode=require` if your host needs it (Prisma +
  Supabase poolers require TLS).

### A.2 Web — Vercel

The repo root is a Vite app; `vercel.json` (added) pins `npm run build` → `dist`, immutable-caches
`/assets/*`, and rewrites extension-less routes to `/index.html` so React Router deep links work.

1. Import the repo in Vercel (framework auto-detected as Vite).
2. **Environment Variables** (Production + Preview):
   - `VITE_DATA_SOURCE=http`
   - `VITE_API_URL=https://<your-api-host>` (e.g. `https://trlife-api.onrender.com`) — no trailing slash.
3. Deploy. Vercel builds the SPA (`tsc -b && vite build`) and serves `dist`.

> `VITE_API_URL` is baked at **build time**, so change it via a redeploy, not a runtime env.

### A.3 API — always-on service (Render / Railway / Fly.io)

Deploy `apps/api/Dockerfile` as a Docker web service. The build runs the typecheck + unit suite, so a
red suite blocks the image; the entrypoint runs `prisma migrate deploy` then starts the server.

Environment (set in the host dashboard — **never** in the repo):

```
NODE_ENV=production
PORT=4000                      # Dockerfile EXPOSEs 4000; host routes to it
DATABASE_URL=<Supabase Session pooler URL from §A.1>
CORS_ORIGIN=https://<your-app>.vercel.app   # MUST match the browser origin exactly
LOG_LEVEL=info
LOG_PRETTY=false
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
# --- uploads: use Supabase Storage (durable, no disk) ---
STORAGE_DRIVER=s3
STORAGE_S3_BUCKET=<your-supabase-bucket>            # e.g. "documents"
STORAGE_S3_REGION=auto
STORAGE_S3_ENDPOINT=https://<project-ref>.storage.supabase.co
STORAGE_S3_ACCESS_KEY=<Supabase Storage S3 access key>
STORAGE_S3_SECRET_KEY=<Supabase Storage S3 secret key>
STORAGE_S3_FORCE_PATH_STYLE=true
STORAGE_SIGNED_URL_TTL=300
# (Alternative, single-box with a mounted disk: STORAGE_DRIVER=local,
#  STORAGE_LOCAL_DIR=/data/storage, STORAGE_PUBLIC_BASE_URL=https://<your-api-host>)
QUEUE_DRIVER=memory
QUEUE_ENABLED=true
```

Health check path: `/health` (liveness). Readiness is `/ready` (returns 503 if the DB is unreachable).

**Uploads / durability:** the `s3` driver is implemented (`storage/s3Driver.ts`) and works with Supabase
Storage's S3-compatible endpoint. In the Supabase dashboard → Storage → create a **private** bucket, then
**Settings → S3** → "Generate new access key" (an S3 `AccessKey`/`SecretKey` scoped to the storage
endpoint). Point `STORAGE_S3_*` at it. The browser then PUTs/GETs presigned URLs that go **directly to
Supabase** — no writable disk needed, so uploads survive restarts. Keys are still server-generated and
opaque; MIME is allowlisted before a ticket is issued; a presigned GET returns the bytes as an opaque
`application/octet-stream` attachment. The `local` driver remains available for a single-box deploy — in
that case mount a **persistent disk** at `/data/storage` (Render Disk), otherwise ephemeral free tiers
lose files on redeploy. Supabase Storage's S3 layer does not currently enforce per-object size caps on a
presigned PUT, so the declared `sizeBytes` is validated at ticket time against `STORAGE_MAX_UPLOAD_BYTES`
(default 10 MiB) — set a Supabase bucket file-size limit / use a policy if you need hard enforcement.

**If you use `local` instead:** the HMAC `STORAGE_SIGNING_KEY` + `STORAGE_PUBLIC_BASE_URL` matter (the
`/storage` router serves the bytes); under `s3` those two are unused for file access.

**Queue on an always-on host:** the in-memory worker runs in-process, which is exactly the design's
intended environment (single instance). Fine as-is. Only if you scale to multiple API replicas would
you need the durable Postgres queue driver (also intentionally unimplemented).

### A.4 First ADMIN

`POST /auth/register` always creates a `USER`, and the prod entrypoint does not run the dev seed.
Register your account through the app, then promote it in **Supabase SQL editor**:

```sql
update public.users set role = 'ADMIN' where email = 'you@example.com';
```

### A.5 Verify

```bash
curl -fsS https://<your-api-host>/health && echo
curl -fsS https://<your-api-host>/ready  && echo
# open https://<your-app>.vercel.app , log in, hit /admin
```

If login fetches fail with a CORS error, `CORS_ORIGIN` on the API does not exactly equal the Vercel
origin (scheme + host, no trailing slash). If uploads 404, check `STORAGE_PUBLIC_BASE_URL` and the disk mount.

---

## B. Single-box Docker Compose (alternative)

Concrete, copy-paste commands to deploy the containerized stack (`db` + `api` + `web`) built by
Phase 19 on one host. Run these on a **real machine that has Docker Engine + Docker Compose v2** — the
dev sandbox used to author this project has no Docker, so the images are only ever built/run here by CI.

> Everything below assumes you are in the **repository root** (the folder containing
> `docker-compose.prod.yml`). The build context for both images is this root.

## 0. Prerequisites

```bash
docker --version            # Docker Engine 24+
docker compose version      # Compose v2 (the `docker compose` plugin, not the old python `docker-compose`)
```

You need a Docker host, a free `:80`/`:443` (or chosen ports), and a place to terminate TLS.
The images themselves do **not** do TLS — put a reverse proxy (Caddy / Traefik / nginx / your cloud
LB) in front in real production. The commands below run the raw stack for verification.

## 1. Secrets & configuration

Compose reads variables from a root `.env` file automatically. Create it with **real** secrets —
never commit this file (`.gitignore` already excludes `.env*` except `.env.example`).

```bash
# Generate strong secrets
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
STORAGE_SIGN=$(openssl rand -hex 32)
PGPASS=$(openssl rand -hex 24)

# Set these to your real public URLs (no trailing slash)
WEB_URL="https://app.example.com"
API_URL="https://api.example.com"

cat > .env <<EOF
# --- database (internal, used by the db container + the api DATABASE_URL) ---
POSTGRES_USER=trlife
POSTGRES_PASSWORD=${PGPASS}
POSTGRES_DB=trlife

# --- public origins (CORS + browser->API base + signed download URLs) ---
PUBLIC_WEB_URL=${WEB_URL}
PUBLIC_API_URL=${API_URL}

# --- api runtime ---
LOG_LEVEL=info
JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12

# --- storage / signing ---
STORAGE_SIGNING_KEY=${STORAGE_SIGN}
STORAGE_SIGNED_URL_TTL=300

# --- host port bindings ---
API_PORT=4000
WEB_PORT=8080
EOF

chmod 600 .env
echo ".env written — DO NOT COMMIT IT"
```

Notes:
- `docker-compose.prod.yml` marks `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and
  `STORAGE_SIGNING_KEY` with `:?` — compose **fails fast** if any is missing, so a blank secret can't
  silently ship.
- The API additionally runs `assertProductionSecrets()` at boot: under `NODE_ENV=production` it refuses
  placeholder values (`change-me-*`, the default storage key). If it starts, your secrets are real.
- `PUBLIC_API_URL` is baked into the web image at **build time** (Vite `VITE_API_URL`) and also used for
  signed file URLs, so it must be correct before you build.

## 2. Build the images

```bash
# Both images, or run `up` (it builds anything not already present).
docker compose -f docker-compose.prod.yml build
```

This builds:
- `api` ← `apps/api/Dockerfile` (repo-root context so `packages/shared` resolves): shared build →
  `prisma generate` → `tsc` → **typecheck + unit tests run inside the build** (a red suite fails it) →
  prod-only prune → slim non-root runtime.
- `web` ← root `Dockerfile`: Vite build (with `VITE_DATA_SOURCE=http`, `VITE_API_URL=$PUBLIC_API_URL`)
  → nginx static.

## 3. Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps        # all three should be healthy/running
```

On boot the `api` entrypoint runs `prisma migrate deploy` (default `RUN_MIGRATIONS=true`), then starts
the server. Watch it:

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

**Multi-replica?** Set `RUN_MIGRATIONS=false` on the api service and run migrations once as a job:

```bash
docker compose -f docker-compose.prod.yml run --rm api prisma migrate deploy
```

## 4. Verify

```bash
# API liveness (process up) and readiness (DB reachable)
curl -fsS http://localhost:4000/health && echo
curl -fsS http://localhost:4000/ready  && echo

# Web serves the SPA shell + its health probe
curl -fsS http://localhost:8080/healthz && echo
curl -fsS http://localhost:8080/ | head -n 1        # expect: <!doctype html>
```

Functional smoke test (register → login → hit a protected route):

```bash
curl -fsS -X POST http://localhost:4000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"smoke@example.com","password":"Passw0rd!smoke","fullName":"Smoke Test"}'
```

## 5. Bootstrap the first ADMIN

The production entrypoint does **not** run the dev seed (`npm run db:seed` wipes + reloads sample data —
wrong for prod), and `POST /auth/register` always creates a `USER`. So: register an account through the
app/API, then promote it directly in Postgres:

```bash
docker compose -f docker-compose.prod.yml exec db \
  psql -U trlife -d trlife \
  -c "UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';"
```

Table/column names are from `apps/api/prisma/schema.prisma` (`users`, `email`, `role`; enum values
`USER | PROVIDER | ADMIN | SUPER_ADMIN`). `/admin/*` requires a token whose role is ADMIN/SUPER_ADMIN.

## 6. Operational commands

```bash
# Shell into a container
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec web sh

# Live logs / restart one service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml restart api

# Back up the database (safe, uses the running container's own client)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U trlife -d trlife --format=custom > backup-$(date +%Y%m%d-%H%M).dump

# Restore into a fresh stack
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U trlife -d trlife --clean < backup-YYYYMMDD-HHMM.dump
```

Uploaded files live in the named volume `trlife_storage` (mounted at `/data/storage`); Postgres data in
`trlife_pgdata`. Back both up — the DB stores only `storageKey` + metadata, the bytes are in the volume
(files are never stored in Postgres).

## 7. Deploy a new version

```bash
git pull
docker compose -f docker-compose.prod.yml build          # rebuild with new code
docker compose -f docker-compose.prod.yml up -d          # recreate changed containers
# migrations (if any new ones) run automatically at api boot
docker image prune -f                                    # drop dangling old layers
```

Rollback = check out the previous tag/sha and repeat step 7 (images are tagged `:latest` locally;
if you push to a registry, tag by git sha and point compose at the exact tag you want).

## 8. Teardown

```bash
docker compose -f docker-compose.prod.yml down           # stop containers (keeps volumes)
docker compose -f docker-compose.prod.yml down -v        # DANGER: also deletes db + storage volumes
```

## 9. TLS / real domain (production finishing)

The stack exposes plain HTTP on `API_PORT`/`WEB_PORT`. In front of it, terminate TLS and route by host:
- **Caddy** (simplest): reverse_proxy `api.example.com` → `localhost:4000`, `app.example.com` → `localhost:8080`;
  Caddy auto-provisions Let's Encrypt certs.
- Or Traefik / nginx / your cloud load balancer.

Because the browser calls the API cross-origin, make sure `PUBLIC_WEB_URL` exactly matches the origin
users load (scheme + host, no trailing slash) — it feeds the CORS allowlist, and mismatched CORS will
break login with opaque fetch errors.

## 10. What is intentionally NOT automated here

- **No image push / cloud deploy** — publishing to a registry or a host is an explicit operator action;
  nothing in this project pushes or deploys on its own.
- A **durable queue driver** (Postgres/Redis) is not implemented; `getQueue()` throws for non-`memory`
  rather than pretending. (The **S3 / Supabase Storage driver IS implemented** — see §A.3; use it for
  durable uploads.) The local driver + in-memory queue are fine for a single instance; multi-instance
  needs the durable queue driver first.
- **Real external job-source adapters** are not wired; the registry is empty and sync endpoints 409
  unless an adapter is registered AND its source row is `enabled` (no scraping, no fabricated feeds).
- **Metrics/tracing** (Prometheus/OTel) are not stubbed — see the observability note in README.
