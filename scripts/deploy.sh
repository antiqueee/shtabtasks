#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

rsync -av --delete --delete-excluded \
  --exclude node_modules --exclude .next --exclude dist \
  --exclude .git --exclude .claude --exclude '.DS_Store' \
  --exclude '*.log' --exclude '*.tsbuildinfo' --exclude .env \
  --exclude apps/web/src/generated \
  ./ shtab:~/shtab-tasks/

scp .env shtab:~/shtab-tasks/.env

ssh shtab 'cd ~/shtab-tasks && docker compose build && docker compose up -d && docker compose exec -T postgres sh -lc "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\"" < packages/db/drizzle/0001_nullable_task_due_at.sql'

echo "Deployed."
