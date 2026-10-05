# syntax=docker/dockerfile:1
#
# TR Life API — production image.
#
# Build context MUST be the repository root so we can reach `packages/shared`
# (a `file:` dependency of apps/api). Example:
#
#   docker build -f apps/api/Dockerfile -t trlife-api .
#
# The image runs as a non-root user, listens on :4000, exposes `/health` (liveness)
# and `/ready` (DB-aware readiness), and can optionally apply Prisma migrations on boot
# (set RUN_MIGRATIONS=true). Secrets come in via environment / env_file — never COPY.

# ---------- Build stage ----------
FROM node:22-slim AS build

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# Install + compile @tr-life/shared first; apps/api imports its built dist/.
COPY packages/shared/package.json packages/shared/package-lock.json* packages/shared/tsconfig.json /app/packages/shared/
COPY packages/shared/src /app/packages/shared/src/
RUN --mount=type=cache,target=/root/.npm \
    cd /app/packages/shared && npm ci --no-audit --no-fund && npm run build

# Install apps/api with devDeps (needed for `prisma generate` + `tsc`).
COPY apps/api/package.json apps/api/package-lock.json /app/apps/api/
RUN --mount=type=cache,target=/root/.npm \
    cd /app/apps/api && npm ci --no-audit --no-fund

# Copy api source and prisma schema/migrations, then build (prisma generate + tsc).
COPY apps/api/tsconfig.json apps/api/tsconfig.test.json /app/apps/api/
COPY apps/api/prisma /app/apps/api/prisma/
COPY apps/api/src /app/apps/api/src/
COPY apps/api/test /app/apps/api/test/
RUN cd /app/apps/api && npm run build

# Fail the build if the deterministic unit suite is red. DB-gated integration
# tests are skipped by design (RUN_DB_TESTS unset), matching local behaviour.
RUN cd /app/apps/api && npm run test:types && npm test

# Strip devDeps — `@prisma/client` and the generated engine stay (production deps).
RUN cd /app/apps/api && npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    STORAGE_LOCAL_DIR=/data/storage \
    RUN_MIGRATIONS=true

# Prisma CLI is used by the entrypoint to run `migrate deploy` before serving.
# Installing it globally keeps the app's own node_modules strictly production-only.
# Version pinned to match @prisma/client (^5.19 → 5.22.x) so engines agree.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g prisma@5.22.0 --no-audit --no-fund

# Non-root runtime user + writable storage volume.
RUN groupadd --system nodejs && useradd --system --gid nodejs --create-home nodejs \
 && mkdir -p /data/storage && chown -R nodejs:nodejs /data /app

# Preserve the workspace layout so the `file:../../packages/shared` node_modules
# symlink still resolves at runtime.
COPY --from=build --chown=nodejs:nodejs /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=build --chown=nodejs:nodejs /app/packages/shared/dist         /app/packages/shared/dist
COPY --from=build --chown=nodejs:nodejs /app/apps/api/package.json        /app/apps/api/package.json
COPY --from=build --chown=nodejs:nodejs /app/apps/api/dist                /app/apps/api/dist
COPY --from=build --chown=nodejs:nodejs /app/apps/api/node_modules        /app/apps/api/node_modules

# Prisma schema + migrations only need to exist for the entrypoint's migrate step;
# the app itself reads the generated client from node_modules/.prisma/client.
COPY --from=build --chown=nodejs:nodejs /app/apps/api/prisma/schema.prisma /app/apps/api/prisma/schema.prisma
COPY --from=build --chown=nodejs:nodejs /app/apps/api/prisma/migrations    /app/apps/api/prisma/migrations

COPY --chown=nodejs:nodejs apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nodejs
WORKDIR /app/apps/api
EXPOSE 4000

# Liveness probe — hits the process, not the DB. Readiness is /ready.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
