# Stage 1: Gemeinsame Basis für Dependencies
# =========================================================
FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY . .

ARG PUBLIC_URL_BACKEND
ARG PUBLIC_URL

ENV PUBLIC_URL_BACKEND=${PUBLIC_URL_BACKEND}
ENV PUBLIC_URL=${PUBLIC_URL}

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
RUN bun --bun run prepare







FROM base AS development

ENV NODE_ENV=development \
    PORT=3000

WORKDIR /app

EXPOSE $PORT

# Vorinstallierte dependencies aus der base-Stage in ein temporäres Verzeichnis kopieren
COPY --from=base --chown=nodejs:nodejs /app/node_modules /temp/node_modules
COPY --from=base --chown=nodejs:nodejs /app/.svelte-kit /temp/.svelte-kit


# Beim Start: nur kopieren, wenn /app/node_modules noch nicht existiert,
# dann prepare & Dev-Server starten
CMD ["sh", "-c", "\
  if [ ! -d /app/node_modules ]; then \
    cp -r /temp/node_modules /app; \
  fi && \
  if [ ! -d /app/.svelte-kit ]; then \
    cp -r /temp/.svelte-kit /app; \
  fi && \
  if [ ! -d /app/lib/paraglide ]; then \
    cp -r /temp/lib/paraglide /app/lib; \
  fi && \
  bun --bun run prepare && \
  bun --bun run dev --host 0.0.0.0 --port ${PORT}\
"]







FROM base AS build
ARG NODE_ENV=production

# package.json und bun.lock sind bereits aus der "base"-Stage vorhanden.
COPY . .

RUN bun --bun run prepare
RUN bun --bun run build






FROM oven/bun:1-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S svelte -u 1001

COPY --from=build --chown=svelte:nodejs /app/build ./build
USER svelte

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- --timeout=3 http://localhost:${PORT}/ || exit 1

EXPOSE $PORT
CMD ["bun", "--bun", "run", "build/index.js"]
