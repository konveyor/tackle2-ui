#!/bin/bash
set -euo pipefail

# Build ignore list from workspaces
IGNORE_ESLINT=()
IGNORE_PRETTIER=()

for ws in $(jq -r '.workspaces[]' package.json); do
  IGNORE_ESLINT+=(--ignore-pattern "${ws}/**")
  IGNORE_PRETTIER+=("!${ws}/**")
done

npx eslint "${IGNORE_ESLINT[@]}" .
npx prettier --ignore-unknown --check . "${IGNORE_PRETTIER[@]}"
