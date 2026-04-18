FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/bot/package.json ./apps/bot/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/bot/node_modules ./apps/bot/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# tsc -b with project references builds packages/db, packages/shared, then apps/bot
# in dependency order without relying on node_modules symlinks for type resolution
RUN pnpm --filter @shtab/bot build
RUN ls apps/bot/dist

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 botuser

COPY --from=builder --chown=botuser:nodejs /app/apps/bot/dist ./apps/bot/dist
# Copy bot's direct deps (grammy, drizzle-orm, etc.); @shtab/* entries are symlinks
COPY --from=builder /app/apps/bot/node_modules ./apps/bot/node_modules
# Remove @shtab symlinks (they point to packages/* which won't exist in runner)
RUN rm -rf apps/bot/node_modules/@shtab/db apps/bot/node_modules/@shtab/shared
# Place actual built packages where node resolves them
COPY --from=builder /app/packages/db/dist ./apps/bot/node_modules/@shtab/db/dist
COPY --from=builder /app/packages/db/package.json ./apps/bot/node_modules/@shtab/db/package.json
COPY --from=builder /app/packages/shared/dist ./apps/bot/node_modules/@shtab/shared/dist
COPY --from=builder /app/packages/shared/package.json ./apps/bot/node_modules/@shtab/shared/package.json
# Root node_modules for transitive deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER botuser
CMD ["node", "apps/bot/dist/index.js"]
