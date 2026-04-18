#!/usr/bin/env bash
set -euo pipefail

rsync -av --delete \
  --exclude node_modules --exclude .next --exclude dist \
  --exclude .git --exclude '*.log' --exclude .env \
  ./ shtab:~/shtab-tasks/

scp .env shtab:~/shtab-tasks/.env

ssh shtab 'cd ~/shtab-tasks && docker compose build && docker compose up -d && docker compose exec -T web pnpm --filter @shtab/db migrate'

echo "Deployed."
