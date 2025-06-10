# Stage 1: Dependencies stage with caching
# ==========================================
FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Stage 2: Development stage
# ===========================
FROM base AS development

ENV NODE_ENV=development \
    PORT=8060

COPY . .
EXPOSE $PORT
CMD ["bun", "--bun", "run", "index.ts"]

# Stage 3: Production stage
# ==========================
FROM oven/bun:1-alpine AS production

ENV NODE_ENV=production \
    PORT=8060

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bun -u 1001

# Copy dependencies from base stage
COPY --from=base --chown=bun:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=bun:nodejs /app/package.json ./package.json

# Copy source code
COPY --chown=bun:nodejs . .

# Switch to non-root user
USER bun

EXPOSE $PORT

# Run with bun --bun for better performance
CMD ["bun", "--bun", "run", "index.ts"]