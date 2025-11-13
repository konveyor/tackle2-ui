#!/bin/bash
set -euo pipefail

# Build ignore list from workspaces
IGNORE_PRETTIER=()
WORKSPACES=$(node -e "const pkg = require('./package.json'); (pkg.workspaces || []).forEach(ws => console.log(ws));")
for ws in $WORKSPACES; do
  IGNORE_PRETTIER+=("!${ws}/**")
done

(set -x; npx prettier "$@" "${IGNORE_PRETTIER[@]}")
