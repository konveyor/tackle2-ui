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

export TOKEN=$(curl -kSs -d "{\"user\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}" \
  ${host}/auth/login | jq -r ".token")

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  export TOKEN=""
fi

delete_applications() {
  local pattern="$1"

  apps=$(curl -kSs -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/applications")

  app_ids=$(echo "$apps" | jq -r ".[] | select(.name | startswith(\"$pattern\")) | .id")

  if [[ -z "$app_ids" ]]; then
    return
  fi

  for app_id in $app_ids; do
    app_name=$(echo "$apps" | jq -r ".[] | select(.id == $app_id) | .name")

    delete_response=$(curl -kSs -X DELETE \
      -H "Authorization: Bearer ${TOKEN}" \
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
