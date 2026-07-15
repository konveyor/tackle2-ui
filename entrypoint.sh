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

# Copy the Kube API and service CA bundle to /opt/app-root/src/ca.crt if they exist

# Add Kube API CA
if [ -f "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt" ]; then
   cp /var/run/secrets/kubernetes.io/serviceaccount/ca.crt ${NODE_EXTRA_CA_CERTS}
fi

# Add service serving CA
if [ -f "/var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt" ]; then
    cat /var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt >> ${NODE_EXTRA_CA_CERTS}
fi

# Add custom ingress CA if it exists
if [ -f "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem" ]; then
    cat /etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem >> ${NODE_EXTRA_CA_CERTS}
fi

exec node --enable-source-maps server/dist/index.js
