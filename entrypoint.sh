#!/bin/bash

set -e

if [[ -z "$CONTROLS_API_URL" ]]; then
  echo "You must provide CONTROLS_API_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$APPLICATION_INVENTORY_API_URL" ]]; then
  echo "You must provide APPLICATION_INVENTORY_API_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$PATHFINDER_API_URL" ]]; then
  echo "You must provide PATHFINDER_API_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$SSO_REALM" ]]; then
  echo "You must provide SSO_REALM environment variable" 1>&2
  exit 1
fi

if [[ -z "$SSO_SERVER_URL" ]]; then
  echo "You must provide SSO_SERVER_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$SSO_CLIENT_ID" ]]; then
  echo "You must provide SSO_CLIENT_ID environment variable" 1>&2
  exit 1
fi

# if [ -f ./build/keycloak.json.template ]; then
#   echo "---> Processing keycloak.json.template configuration file..."
#   cp ./build/keycloak.json.template ./build/keycloak.json
#   # envsubst '${SSO_REALM} ${SSO_CLIENT_ID}' < ./build/keycloak.json.template > ./build/keycloak.json
# fi

cd server
exec node index.js
