# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Copy package files for better layer caching
COPY package.json bun.lock ./

# Install all dependencies (including dev dependencies for building)
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun --bun run prepare
RUN bun --bun run build

# Production stage
FROM oven/bun:1 AS production

ENV NODE_ENV=production
WORKDIR /app

# Copy built application and package.json
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

# Install only production dependencies
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --production --frozen-lockfile

# Expose port 3000
EXPOSE 3000

# Run the SvelteKit server
CMD ["bun", "--bun", "run", "build/index.js"]