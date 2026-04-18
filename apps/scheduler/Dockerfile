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
RUN pnpm --filter @shtab/scheduler build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 scheduler

COPY --from=builder --chown=scheduler:nodejs /app/apps/scheduler/dist ./apps/scheduler/dist
COPY --from=builder /app/apps/scheduler/node_modules ./apps/scheduler/node_modules
RUN rm -rf apps/scheduler/node_modules/@shtab/db apps/scheduler/node_modules/@shtab/shared
COPY --from=builder /app/packages/db/dist ./apps/scheduler/node_modules/@shtab/db/dist
COPY --from=builder /app/packages/db/package.json ./apps/scheduler/node_modules/@shtab/db/package.json
COPY --from=builder /app/packages/shared/dist ./apps/scheduler/node_modules/@shtab/shared/dist
COPY --from=builder /app/packages/shared/package.json ./apps/scheduler/node_modules/@shtab/shared/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER scheduler
CMD ["node", "apps/scheduler/dist/index.js"]
