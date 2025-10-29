#!/bin/bash
set -euo pipefail
function npx() {
  xargs -a /dev/null -t npx "$@"
}

# Build ignore list from workspaces
IGNORE_ESLINT=()
IGNORE_PRETTIER=()

WORKSPACES=$(node -e "const pkg = require('./package.json'); (pkg.workspaces || []).forEach(ws => console.log(ws));")
for ws in $WORKSPACES; do
  IGNORE_ESLINT+=(--ignore-pattern "${ws}/**")
  IGNORE_PRETTIER+=("!${ws}/**")
done

npx eslint "${IGNORE_ESLINT[@]}" .
npx prettier --ignore-unknown --check . "${IGNORE_PRETTIER[@]}"
