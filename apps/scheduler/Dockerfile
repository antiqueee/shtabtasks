FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/scheduler/package.json ./apps/scheduler/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/scheduler/node_modules ./apps/scheduler/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
# Build workspace packages
RUN pnpm --filter @shtab/db build
RUN pnpm --filter @shtab/shared build
# Docker COPY dereferences symlinks, so apps/scheduler/node_modules/@shtab/db has no dist yet.
# Copy built dist into the dereferenced stubs so tsc and node can resolve them.
RUN cp -r packages/db/dist apps/scheduler/node_modules/@shtab/db/ && \
    cp -r packages/shared/dist apps/scheduler/node_modules/@shtab/shared/
RUN pnpm --filter @shtab/scheduler build
RUN ls apps/scheduler/dist

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 scheduler

COPY --from=builder --chown=scheduler:nodejs /app/apps/scheduler/dist ./apps/scheduler/dist
# scheduler's direct deps (node-cron, drizzle-orm, etc.) live here after Docker dereference
COPY --from=builder /app/apps/scheduler/node_modules ./apps/scheduler/node_modules
# Overwrite workspace stubs with actual built packages
COPY --from=builder /app/packages/db/dist ./apps/scheduler/node_modules/@shtab/db/dist
COPY --from=builder /app/packages/db/package.json ./apps/scheduler/node_modules/@shtab/db/package.json
COPY --from=builder /app/packages/shared/dist ./apps/scheduler/node_modules/@shtab/shared/dist
COPY --from=builder /app/packages/shared/package.json ./apps/scheduler/node_modules/@shtab/shared/package.json
# Root node_modules for transitive deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER scheduler
CMD ["node", "apps/scheduler/dist/index.js"]
