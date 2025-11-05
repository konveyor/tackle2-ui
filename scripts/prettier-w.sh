#!/bin/bash
set -euo pipefail
function npx() {
  xargs -a /dev/null -t npx "$@"
}

# Build ignore list from workspaces
IGNORE_PRETTIER=()
WORKSPACES=$(node -e "const pkg = require('./package.json'); (pkg.workspaces || []).forEach(ws => console.log(ws));")
for ws in $WORKSPACES; do
  IGNORE_PRETTIER+=("!${ws}/**")
done

npx prettier "$@" "${IGNORE_PRETTIER[@]}"
