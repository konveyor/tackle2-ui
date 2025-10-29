#!/bin/bash
set -euo pipefail

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not installed. Please install jq to run this script." >&2
  exit 1
fi

# Build ignore list from workspaces
IGNORE_ESLINT=()
IGNORE_PRETTIER=()

for ws in $(jq -r '.workspaces[]' package.json); do
  IGNORE_ESLINT+=(--ignore-pattern "${ws}/**")
  IGNORE_PRETTIER+=("!${ws}/**")
done

npx eslint "${IGNORE_ESLINT[@]}" .
npx prettier --ignore-unknown --check . "${IGNORE_PRETTIER[@]}"
