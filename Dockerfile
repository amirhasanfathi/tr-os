# syntax=docker/dockerfile:1
#
# TR Life OS web app — production image (Vite build → nginx static).
#
# Build from the repository root:
#
#   docker build -t trlife-web --build-arg VITE_DATA_SOURCE=http \
#                --build-arg VITE_API_URL=https://api.example.com .
#
# Vite bakes `import.meta.env.VITE_*` at BUILD time, so those two args are ARG (not
# runtime env). Switching data source requires a rebuild — that is expected.
# The API URL is only consulted when VITE_DATA_SOURCE=http.

# ---------- Build stage ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Fail the image if TypeScript is not clean (tsc -b is part of `npm run build`).
ARG VITE_DATA_SOURCE=mock
ARG VITE_API_URL=http://localhost:4000
ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

# Drop the default site and install our SPA config (immutable asset caching, SPA
# fallback, /healthz probe). nginx runs as root only to bind :80; worker drops to
# `nginx` via the base image's own config.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Non-root writable cache dirs used by nginx (pid/body/temp).
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
