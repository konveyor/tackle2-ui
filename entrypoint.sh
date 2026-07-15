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
export NODE_EXTRA_CA_CERTS="${NODE_EXTRA_CA_CERTS:-/opt/app-root/src/ca.crt}"

ca_sources=(
  # Kubernetes API server CA (standard SA volume mount)
  /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
  # OpenShift service-serving CA (requires operator-managed ConfigMap mount)
  /var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt
  # Cluster-injected custom/proxy CAs via RHEL trust store
  /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem
)

found=false
touch "${NODE_EXTRA_CA_CERTS}"
for src in "${ca_sources[@]}"; do
  if [ -f "$src" ]; then
    cat "$src" >> "${NODE_EXTRA_CA_CERTS}"
    found=true
  fi
done

if [ "$found" = false ]; then
  rm -f "${NODE_EXTRA_CA_CERTS}"
  unset NODE_EXTRA_CA_CERTS
fi

exec node --enable-source-maps server/dist/index.js
