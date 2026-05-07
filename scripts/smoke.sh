#!/usr/bin/env bash
set -euo pipefail

npm run build

if [[ -n "${SMOKE_PORT:-}" ]]; then
  port="$SMOKE_PORT"
else
  port=""
  for candidate in {4173..4199}; do
    if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then
      port="$candidate"
      break
    fi
  done
fi

if [[ -z "$port" ]]; then
  printf "No free local port found for smoke server.\n"
  exit 1
fi

node scripts/serve-docs.mjs "$port" > /tmp/granular-physics-lab-smoke.log 2>&1 &
server_pid="$!"
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

for _ in {1..50}; do
  if curl -fsS "http://127.0.0.1:${port}/granular-physics-lab/" >/dev/null; then
    break
  fi
  sleep 0.1
done

SMOKE_URL="http://127.0.0.1:${port}/granular-physics-lab/" node scripts/smoke-playwright.mjs
