#!/bin/sh
# TR Life API container entrypoint.
#
# Applies Prisma migrations on boot when RUN_MIGRATIONS=true (default). Set it to
# false in environments where a separate job/CI step owns schema rollout — running
# migrations from every replica races. This script fails loudly: a bad migration
# must never let the server start against a half-migrated schema.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] applying prisma migrations (prisma migrate deploy)"
  prisma migrate deploy
fi

exec "$@"
