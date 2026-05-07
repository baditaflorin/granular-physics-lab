#!/usr/bin/env bash
set -euo pipefail

npm run build

if [[ -n "${VISUAL_CHECK_PORT:-}" ]]; then
  port="$VISUAL_CHECK_PORT"
else
  port=""
  for candidate in {4200..4240}; do
    if ! lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then
      port="$candidate"
      break
    fi
  done
fi

if [[ -z "$port" ]]; then
  printf "No free local port found for visual check server.\n"
  exit 1
fi

node scripts/serve-docs.mjs "$port" > /tmp/granular-physics-lab-visual.log 2>&1 &
server_pid="$!"
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

for _ in {1..50}; do
  if curl -fsS "http://127.0.0.1:${port}/granular-physics-lab/" >/dev/null; then
    break
  fi
  sleep 0.1
done

VISUAL_CHECK_URL="http://127.0.0.1:${port}/granular-physics-lab/" node scripts/visual-check.mjs

