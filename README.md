# Штабные задачи

Система управления задачами избирательного штаба.

## Стек

- **Web**: Next.js 15 (App Router, TypeScript, Tailwind, Auth.js v5)
- **Bot**: Node.js + grammY (Telegram, long polling)
- **DB**: PostgreSQL 16 + pgvector, Drizzle ORM
- **Shared**: Zod-схемы, обёртки над OpenRouter и Yandex SpeechKit
- **Deploy**: Docker Compose + Caddy

## Локальная разработка

```bash
pnpm install
docker compose up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

## Первый деплой на сервер

```bash
./scripts/bootstrap-server.sh
scp .env shtab:~/shtab-tasks/.env
./scripts/deploy.sh
```

## Обычный деплой

```bash
./scripts/deploy.sh
```

## Переменные окружения

Все переменные описаны в `.env.example`.
