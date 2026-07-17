#!/bin/bash

set -e

if [[ -z "$TACKLE_HUB_URL" ]]; then
  echo "You must provide TACKLE_HUB_URL environment variable" 1>&2
  exit 1
fi

if [[ $AUTH_REQUIRED != "false" ]]; then
  if [[ -z "$OIDC_ISSUER" && -z "$OIDC_CLIENT_ID" ]]; then
    echo "Further configuration via environment variables is required to enable authentication," 1>&2
    echo "OIDC_ISSUER and OIDC_CLIENT_ID are required." 1>&2
    exit 1
  fi

  if [[ -n "$OIDC_ISSUER" && -z "$OIDC_CLIENT_ID" ]]; then
    echo "You must provide OIDC_CLIENT_ID environment variable" 1>&2
    exit 1
  elif [[ -z "$OIDC_ISSUER" && -n "$OIDC_CLIENT_ID" ]]; then
    echo "You must provide OIDC_ISSUER environment variable" 1>&2
    exit 1
  fi
fi

# Build a combined CA bundle for Node.js, which does not use the system trust store.
# NODE_EXTRA_CA_CERTS adds CAs on top of Node's compiled-in Mozilla root CAs.
# If NODE_EXTRA_CA_CERTS is already set to an existing file, it is treated as
# an additional input source rather than the output path, so read-only mounts
# (Secrets, ConfigMaps) are safe to use.
ca_bundle="/tmp/node-ca-bundle.pem"

ca_sources=(
  # Kubernetes API server CA (standard SA volume mount)
  /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
  # OpenShift service-serving CA (requires operator-managed ConfigMap mount)
  /var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt
  # Cluster-injected custom/proxy CAs via RHEL trust store
  /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
)

# If the caller pre-set NODE_EXTRA_CA_CERTS to an existing file, include it.
if [ -n "${NODE_EXTRA_CA_CERTS:-}" ] && [ -f "${NODE_EXTRA_CA_CERTS}" ]; then
  ca_sources+=("${NODE_EXTRA_CA_CERTS}")
fi

# Pick up any certs dropped into the well-known drop-in directory.
# Mount a ConfigMap or Secret to /opt/app-root/ca-certs.d/ with *.crt or *.pem
# files and they will be included automatically without rebuilding the image.
for f in /opt/app-root/ca-certs.d/*.crt /opt/app-root/ca-certs.d/*.pem; do
  [ -f "$f" ] && ca_sources+=("$f")
done

found=false
: > "${ca_bundle}"
for src in "${ca_sources[@]}"; do
  if [ -f "$src" ]; then
    cat "$src" >> "${ca_bundle}"
    found=true
  fi
done

if [ "$found" = true ]; then
  export NODE_EXTRA_CA_CERTS="${ca_bundle}"
else
  rm -f "${ca_bundle}"
  unset NODE_EXTRA_CA_CERTS
fi

exec node --enable-source-maps server/dist/index.js
