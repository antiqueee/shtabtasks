FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/bot/package.json ./apps/bot/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @shtab/db build
RUN pnpm --filter @shtab/shared build
RUN pnpm --filter @shtab/bot build
RUN pnpm --filter @shtab/bot --prod deploy /prod/bot
RUN rm -rf /prod/bot/src /prod/bot/Dockerfile /prod/bot/tsconfig.json /prod/bot/tsconfig.tsbuildinfo

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 botuser

COPY --from=builder --chown=botuser:nodejs /prod/bot ./

USER botuser
CMD ["node", "dist/index.js"]
