FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @shtab/db build
RUN pnpm --filter @shtab/shared build
RUN rm -rf apps/web/node_modules/@shtab/db apps/web/node_modules/@shtab/shared && \
    mkdir -p apps/web/node_modules/@shtab/db apps/web/node_modules/@shtab/shared && \
    cp packages/db/package.json apps/web/node_modules/@shtab/db/ && \
    cp -r packages/db/dist apps/web/node_modules/@shtab/db/ && \
    cp packages/shared/package.json apps/web/node_modules/@shtab/shared/ && \
    cp -r packages/shared/dist apps/web/node_modules/@shtab/shared/
# apps/web/src/generated is gitignored; populate it from built dist so Next.js can resolve imports.
# Run next build directly (not via pnpm script) to skip prepare-workspace-imports.mjs which uses
# Node cpSync and would wipe and re-copy — shell cp is simpler and reliable.
RUN mkdir -p apps/web/src/generated/db apps/web/src/generated/shared && \
    cp -r packages/db/dist/. apps/web/src/generated/db/ && \
    cp -r packages/shared/dist/. apps/web/src/generated/shared/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && node_modules/.bin/next build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
