#!/usr/bin/env bash
# scripts/run-proxy.sh
#
# Run the Caddy proxy container for local development or production-like testing.
#
# Usage:
#   scripts/run-proxy.sh [--dev|--prod] [--no-watch]
#
#   --dev        Use Caddyfile.dev (default).  Forwards API paths to kubectl
#                port-forwards and everything else to the rspack dev server on :9001.
#   --prod       Use Caddyfile.prod.  Serves client/dist as static files.
#                Requires a built client (npm run build -w common -w client).
#   --no-watch   Disable Caddy's config live-reload (--watch).
#
# ── Network behavior ────────────────────────────────────────────────────────
#
#   Linux   --network=host is used.  Services bound to localhost (rspack :9001,
#           kubectl port-forwards :9002-9004) are directly reachable.
#
#   macOS   Podman runs inside a Linux VM; --network=host binds to the VM, not
#           the Mac.  This script publishes the Caddy port (-p) so the Mac
#           browser can reach it, and rewrites localhost → host.containers.internal
#           in upstream URLs so the container can reach Mac-local services.
#
# ── Environment variables (all optional) ────────────────────────────────────
#
#   PORT                  Caddy listen port  (default: 9000 dev, 8080 prod)
#   DEV_SERVER_HOST       rspack dev server host  (default: localhost / hci)
#   TACKLE_HUB_URL        Hub API upstream        (default: http://localhost:9002)
#   KAI_LLM_PROXY_URL     LLM proxy upstream      (default: http://localhost:9003)
#   KEYCLOAK_SERVER_URL   Legacy Keycloak upstream (default: http://localhost:9004)
#
#   Any other variables set in your shell are forwarded to the container via
#   --env-host (Podman only; Docker does not support this flag).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE="registry.access.redhat.com/hi/caddy:2.11-builder"

# ── Defaults ────────────────────────────────────────────────────────────────
MODE="dev"
WATCH="--watch"

# ── Argument parsing ─────────────────────────────────────────────────────────
for arg in "$@"; do
    case "$arg" in
        --dev)      MODE="dev" ;;
        --prod)     MODE="prod" ; WATCH="" ;;
        --no-watch) WATCH="" ;;
        *)
            echo "Unknown argument: $arg" >&2
            echo "Usage: $0 [--dev|--prod] [--no-watch]" >&2
            exit 1
            ;;
    esac
done

CADDYFILE="/etc/caddy/Caddyfile.$MODE"
DEFAULT_PORT="$( [[ "$MODE" == "prod" ]] && echo "8080" || echo "9000" )"

# ── Volume mounts ─────────────────────────────────────────────────────────────
MOUNTS=(
    -v "$PROJECT_ROOT/container/caddy:/etc/caddy:ro,z"
)
if [[ "$MODE" == "prod" ]]; then
    if [[ ! -d "$PROJECT_ROOT/dist" ]]; then
        echo "error: dist not found — run 'npm run build' first." >&2
        exit 1
    fi
    MOUNTS+=( -v "$PROJECT_ROOT/dist:/srv:ro,z" )
fi

# ── Network / upstream URL resolution ────────────────────────────────────────
#
# On macOS, rewrite http://localhost:<port> → http://host.containers.internal:<port>
# so that the Caddy container (running in a Podman VM) can reach services that
# are bound to the Mac's loopback interface.  URLs already pointing at a
# non-localhost host are left unchanged.
_to_container_host() {
    echo "${1//localhost/host.containers.internal}"
}

OS="$(uname -s)"

PORT="${PORT:-$DEFAULT_PORT}"
if [[ "$OS" == "Darwin" ]]; then

    NETWORK_ARGS=( -p "${PORT}:${PORT}" )

    # Resolve upstream URLs: honour any user-set value but replace localhost
    # addresses with host.containers.internal.
    EXTRA_ENV=(
        -e "PORT=${PORT}"
        -e "DEV_SERVER_HOST=$( _to_container_host "${DEV_SERVER_HOST:-localhost}" )"
        -e "TACKLE_HUB_URL=$( _to_container_host "${TACKLE_HUB_URL:-http://localhost:9002}" )"
        -e "KAI_LLM_PROXY_URL=$( _to_container_host "${KAI_LLM_PROXY_URL:-http://localhost:9003}" )"
        -e "KEYCLOAK_SERVER_URL=$( _to_container_host "${KEYCLOAK_SERVER_URL:-http://localhost:9004}" )"
    )

    echo "OS: macOS — publishing :${PORT}, using host.containers.internal for upstream hosts"
    echo "Visit: http://localhost:${PORT}"
else
    # Linux (and anything else): --network=host makes the container share the
    # host network stack; no URL translation needed.
    NETWORK_ARGS=( --network=host )
    EXTRA_ENV=()

    echo "OS: Linux — using --network=host"
fi

echo "Mode: $MODE  |  Port: $PORT  |  Config: $CADDYFILE  |  Watch: ${WATCH:-off}"
echo ""
echo "Visit: http://localhost:$PORT"
echo ""

# ── Run ───────────────────────────────────────────────────────────────────────
exec podman run --rm \
    "${NETWORK_ARGS[@]}" \
    --env-host \
    "${EXTRA_ENV[@]}" \
    "${MOUNTS[@]}" \
    "$IMAGE" \
    caddy run --config "$CADDYFILE" $WATCH
