# Stage 1: Dependencies stage with caching
# ==========================================
FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile






FROM oven/bun:1-alpine AS development

ENV NODE_ENV=development \
    PORT=8060
WORKDIR /app

EXPOSE $PORT

COPY --from=base --chown=bun:nodejs /app/node_modules /temp/node_modules

CMD ["sh", "-c", "\
if [ ! -d /app/node_modules ]; then \
  cp -r /temp/node_modules /app && rm -rf /temp/node_modules; \
fi; \
bun --bun --watch run index.ts\
"]




# Stage 3: Production stage
# ==========================
FROM oven/bun:1-alpine AS production

ENV NODE_ENV=production \
    PORT=8060

WORKDIR /app

# Copy dependencies from base stage
COPY --from=base --chown=bun:nodejs /app/node_modules ./node_modules

# Copy source code
COPY --chown=bun:nodejs . .

# Switch to non-root user
USER bun

EXPOSE $PORT

# Run with bun --bun for better performance
CMD ["bun", "--bun", "run", "index.ts"]
