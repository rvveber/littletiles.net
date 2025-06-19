# Stage 1: Gemeinsame Basis für Dependencies
# =========================================================
FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile


# Stage 2: Target für die Entwicklung
# ===============================================
FROM base AS development
ENV NODE_ENV=development \
    PORT=3000

# package.json und bun.lock sind bereits aus der "base"-Stage vorhanden.
COPY . .

# Führe "prepare" aus, um SvelteKit zu synchronisieren
RUN bun --bun run prepare

EXPOSE $PORT
CMD bun --bun run dev --host 0.0.0.0 --port ${PORT}


# Stage 3: Stage zum Bauen der Produktions-Artefakte
# ============================================================
FROM base AS build
ARG NODE_ENV=production
ARG PUBLIC_URL_BACKEND
ARG PUBLIC_URL

ENV PUBLIC_URL_BACKEND=${PUBLIC_URL_BACKEND}
ENV PUBLIC_URL=${PUBLIC_URL}

# package.json und bun.lock sind bereits aus der "base"-Stage vorhanden.
COPY . .

# Baue die Anwendung
RUN bun --bun run prepare && bun --bun run build


# Stage 4: Produktions-Stage
# ===========================================================
FROM oven/bun:1-alpine AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S svelte -u 1001

COPY --from=build --chown=svelte:nodejs /app/build ./build
USER svelte

# HEALTHCHECK: Prüft per wget, ob der App-Server antwortet
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- --timeout=3 http://localhost:${PORT}/ || exit 1

EXPOSE $PORT
CMD ["bun", "--bun", "run", "build/index.js"]