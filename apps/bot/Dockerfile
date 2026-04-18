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
# Build workspace packages
RUN pnpm --filter @shtab/db build
RUN pnpm --filter @shtab/shared build
# Docker COPY dereferences symlinks, so apps/bot/node_modules/@shtab/db has no dist yet.
# Copy built dist into the dereferenced stubs so tsc and node can resolve them.
RUN cp -r packages/db/dist apps/bot/node_modules/@shtab/db/ && \
    cp -r packages/shared/dist apps/bot/node_modules/@shtab/shared/
RUN pnpm --filter @shtab/bot build
RUN ls apps/bot/dist

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 botuser

COPY --from=builder --chown=botuser:nodejs /app/apps/bot/dist ./apps/bot/dist
# bot's direct deps (grammy, drizzle-orm, etc.) live here after Docker dereference
COPY --from=builder /app/apps/bot/node_modules ./apps/bot/node_modules
# Overwrite workspace stubs with actual built packages
COPY --from=builder /app/packages/db/dist ./apps/bot/node_modules/@shtab/db/dist
COPY --from=builder /app/packages/db/package.json ./apps/bot/node_modules/@shtab/db/package.json
COPY --from=builder /app/packages/shared/dist ./apps/bot/node_modules/@shtab/shared/dist
COPY --from=builder /app/packages/shared/package.json ./apps/bot/node_modules/@shtab/shared/package.json
# Root node_modules for transitive deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER botuser
CMD ["node", "apps/bot/dist/index.js"]
