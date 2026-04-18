#!/usr/bin/env bash
set -euo pipefail

SERVER="shtab"
REMOTE_DIR="~/shtab-tasks"

rsync -av --delete \
  --exclude node_modules --exclude .next --exclude dist \
  --exclude .git --exclude '*.log' \
  ./ "$SERVER:$REMOTE_DIR/"

ssh "$SERVER" "cd $REMOTE_DIR && docker compose pull && docker compose up -d --build && docker compose exec -T web pnpm db:migrate || true"
