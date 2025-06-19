
FROM oven/bun:1-alpine AS extensions-builder

WORKDIR /extensions

COPY extensions/ .

RUN --mount=type=cache,target=/root/.bun/install/cache \
    for pkg in ./*/*; do \
      [ -f "$pkg/package.json" ] || continue; \
      (cd "$pkg" && bun install --frozen-lockfile && bun run build); \
    done

RUN mkdir -p /built && \
    for pkg in ./*/*; do \
        [ -f "$pkg/package.json" ] || continue; \
        ext=$(basename "$pkg"); \
        mkdir -p "/built/$ext"; \
        cp -r "$pkg/dist" "/built/$ext/"; \
        cp    "$pkg/package.json" "/built/$ext/"; \
    done






FROM directus/directus:11.8 AS base

USER root
RUN corepack enable
USER node

# https://www.npmjs.com/package/directus-extension-schema-sync
RUN pnpm install directus-extension-schema-sync

# original CMD
# CMD ["/bin/sh","-c",": && node cli.js bootstrap && pm2-runtime start ecosystem.config.cjs ;"]

# modified 
# to include --skipAdminInit
# to run schema-sync install

CMD ["/bin/sh","-c",": && node cli.js bootstrap --skipAdminInit && npx directus schema-sync install && pm2-runtime start ecosystem.config.cjs ;"]
# CMD ["/bin/sh","-c",": && node cli.js bootstrap && npx directus schema-sync install --force && pm2-runtime start ecosystem.config.cjs ;"]





FROM base AS production

USER root

COPY --from=extensions-builder --chown=node:node /built /directus/extensions
COPY --chown=node:node ./schema-sync ./schema-sync

USER node

FROM base AS development