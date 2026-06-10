#!/bin/bash

set -e

# Script to cleanup dependencies test data
# Deletes applications created by dependencies.sh

rawHost="${HOST:-localhost:8080}"
if [[ "$rawHost" == *"/hub"* ]]; then
  host="$rawHost"
else
  host="${rawHost}/hub"
fi

if [[ ! "$host" =~ ^https?:// ]]; then
  host="https://${host}"
fi

# Use HTTP Basic Authentication for local Hub users
# Encode credentials for Basic Auth
AUTH_HEADER="Authorization: Basic $(echo -n "${HUB_USER}:${HUB_PASSWORD}" | base64 -w 0)"
export AUTH_HEADER

# Test authentication by making a simple API call
test_response=$(curl -kSs -w "\n%{http_code}" \
  -H "${AUTH_HEADER}" \
  "${host}/applications?limit=1")

http_code=$(echo "$test_response" | tail -n1)

if [[ "$http_code" == "401" || "$http_code" == "403" ]]; then
  echo "ERROR: Authentication failed with HTTP $http_code" >&2
  echo "Please check your credentials (HUB_USER, HUB_PASSWORD)" >&2
  exit 1
fi

delete_applications() {
  local pattern="$1"

  apps=$(curl -kSs -X GET \
    -H "${AUTH_HEADER}" \
    "${host}/applications")

  app_ids=$(echo "$apps" | jq -r ".[] | select(.name | startswith(\"$pattern\")) | .id")

  if [[ -z "$app_ids" ]]; then
    return
  fi

  for app_id in $app_ids; do
    app_name=$(echo "$apps" | jq -r ".[] | select(.id == $app_id) | .name")

    delete_response=$(curl -kSs -X DELETE \
      -H "${AUTH_HEADER}" \
      -w "\nHTTP_STATUS:%{http_code}" \
      "${host}/applications/${app_id}")

    http_status=$(echo "$delete_response" | grep "HTTP_STATUS" | cut -d: -f2)

    if [[ "$http_status" != "204" && "$http_status" != "200" ]]; then
      echo "ERROR: Failed to delete application $app_name (HTTP status: $http_status)"
    fi
  done
}

delete_applications "DependenciesFilteringApp"

echo "Cleanup completed successfully!"
