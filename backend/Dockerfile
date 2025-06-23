
FROM oven/bun:1-alpine AS extensions-builder

WORKDIR /extensions

COPY extensions/hooks ./hooks

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
COPY --chown=node:node --from=extensions-builder /built /directus/extensions
COPY --chown=node:node ./schema-sync ./schema-sync
USER node

# https://www.npmjs.com/package/directus-extension-schema-sync
RUN pnpm install directus-extension-schema-sync




FROM base AS production

# original CMD
# CMD ["/bin/sh","-c",": && node cli.js bootstrap && pm2-runtime start ecosystem.config.cjs ;"]

# modified CMD
# to include --skipAdminInit (to avoid creating a new admin with random role uuid)
# to run schema-sync install (to apply our schema - includes admin role with fixed uuid -> 96fe793c-a8e4-4ec4-84c1-a7f139762227)
CMD [ "/bin/sh", "-euo", "pipefail", "-c", "\
echo '🔧 Bootstrapping…' && \
node cli.js bootstrap --skipAdminInit && \
echo '🔧 Schema-Sync…' && \
npx directus schema-sync install && \
echo '🚀 Starting PM2…' && \
exec pm2-runtime start ecosystem.config.cjs" ]



FROM base AS development

# Temporär als root, um Bun zu installieren und den Cache anzulegen
RUN pnpm install bun
ENV PATH=/directus/node_modules/.bin:$PATH

USER root
# Aus der extensions-builder-Stage das komplette hooks-Verzeichnis (inkl. node_modules) in den Cache kopieren
COPY --from=extensions-builder --chown=node:node /extensions/hooks /opt/extensions_cache/hooks

# Wieder zurück auf den unprivilegierten Node-User
USER node

# Dev-Start: für jede gemountete Extension erst die deps kopieren (falls noch nicht vorhanden),
# dann im Hintergrund bun --watch build laufen lassen, anschließend Directus bootstrappen & PM2 starten
CMD ["/bin/sh","-euo","pipefail","-c", "\
  for dir in /directus/extensions/*; do \
    if [ -d \"$dir\" ]; then \
      ext=$(basename \"$dir\"); \
      echo \"📦 Processing extension: $ext\"; \
      if [ ! -d \"$dir/node_modules\" ]; then \
        echo \"  ↳ Copying dependencies for $ext\"; \
        cp -r \"/opt/extensions_cache/hooks/$ext/node_modules\" \"$dir/node_modules\"; \
      fi; \
      (cd \"$dir\" && bun run --watch build &) ;\
    fi; \
  done; \
  wait; \
  echo '🔧 Bootstrapping…'; \
  node cli.js bootstrap --skipAdminInit; \
  echo '🔧 Schema-Sync…'; \
  npx directus schema-sync install; \
  echo '[DEV] Autocompiling extensions'; \
  echo '🚀 Starting PM2…'; \
  exec pm2-runtime start ecosystem.config.cjs\
"]
