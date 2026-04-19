FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/scheduler/package.json ./apps/scheduler/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @shtab/db build
RUN pnpm --filter @shtab/shared build
RUN pnpm --filter @shtab/scheduler build
RUN pnpm --filter @shtab/scheduler --prod deploy /prod/scheduler
RUN rm -rf /prod/scheduler/src /prod/scheduler/Dockerfile /prod/scheduler/tsconfig.json /prod/scheduler/tsconfig.tsbuildinfo

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 scheduler

COPY --from=builder --chown=scheduler:nodejs /prod/scheduler ./

USER scheduler
CMD ["node", "dist/index.js"]
