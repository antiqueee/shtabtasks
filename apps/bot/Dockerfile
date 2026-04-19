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
RUN rm -rf packages/db/dist packages/shared/dist packages/db/tsconfig.tsbuildinfo packages/shared/tsconfig.tsbuildinfo
RUN ./node_modules/.bin/tsc -b packages/db/tsconfig.json --force
RUN ./node_modules/.bin/tsc -b packages/shared/tsconfig.json --force
RUN ls packages/db/dist/index.js packages/shared/dist/index.js
RUN rm -rf apps/bot/node_modules/@shtab/db apps/bot/node_modules/@shtab/shared \
           node_modules/@shtab/db node_modules/@shtab/shared && \
    mkdir -p apps/bot/node_modules/@shtab/db apps/bot/node_modules/@shtab/shared \
             node_modules/@shtab/db node_modules/@shtab/shared && \
    cp packages/db/package.json apps/bot/node_modules/@shtab/db/ && \
    cp -r packages/db/dist apps/bot/node_modules/@shtab/db/ && \
    cp packages/shared/package.json apps/bot/node_modules/@shtab/shared/ && \
    cp -r packages/shared/dist apps/bot/node_modules/@shtab/shared/ && \
    cp packages/db/package.json node_modules/@shtab/db/ && \
    cp -r packages/db/dist node_modules/@shtab/db/ && \
    cp packages/shared/package.json node_modules/@shtab/shared/ && \
    cp -r packages/shared/dist node_modules/@shtab/shared/
RUN rm -rf apps/bot/dist apps/bot/tsconfig.tsbuildinfo
RUN ./node_modules/.bin/tsc -b apps/bot/tsconfig.json --force
RUN ls apps/bot/dist/index.js

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 botuser

COPY --from=builder --chown=botuser:nodejs /app/apps/bot/dist ./apps/bot/dist
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/shared ./packages/shared
RUN ls packages/db/dist/index.js
COPY --from=builder /app/apps/bot/node_modules ./apps/bot/node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
RUN rm -rf apps/bot/node_modules/@shtab/db apps/bot/node_modules/@shtab/shared && \
    ln -s /app/packages/db apps/bot/node_modules/@shtab/db && \
    ln -s /app/packages/shared apps/bot/node_modules/@shtab/shared
RUN ls apps/bot/node_modules/@shtab/db/dist/index.js

USER botuser
CMD ["node", "apps/bot/dist/index.js"]
