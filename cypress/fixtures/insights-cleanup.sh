#!/bin/bash

set -e

# Script to cleanup insights test data
# Deletes applications created by insights.sh

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
http_code=$(curl -kSs -o /dev/null -w "%{http_code}" \
  -H "${AUTH_HEADER}" \
  "${host}/applications?limit=1")

case "$http_code" in
  200) ;;
  401|403)
    echo "ERROR: Authentication failed with HTTP $http_code" >&2
    echo "Please check your credentials (HUB_USER, HUB_PASSWORD)" >&2
    exit 1
    ;;
  *)
    echo "ERROR: Hub preflight failed with HTTP $http_code" >&2
    echo "Please check HOST and Hub availability." >&2
    exit 1
    ;;
esac

# Function to delete applications by name pattern
delete_applications() {
  local pattern="$1"
  echo "Searching for applications matching pattern: $pattern"

  apps=$(curl -kSs -X GET \
    -H "${AUTH_HEADER}" \
    "${host}/applications")

  # Find all matching application IDs
  app_ids=$(echo "$apps" | jq -r ".[] | select(.name | startswith(\"$pattern\")) | .id")

  if [[ -z "$app_ids" ]]; then
    echo "No applications found matching pattern: $pattern"
    return
  fi

  # Delete each application
  for app_id in $app_ids; do
    app_name=$(echo "$apps" | jq -r ".[] | select(.id == $app_id) | .name")
    echo "Deleting application: $app_name (ID: $app_id)"

    delete_response=$(curl -kSs -X DELETE \
      -H "${AUTH_HEADER}" \
      -w "\nHTTP_STATUS:%{http_code}" \
      "${host}/applications/${app_id}")

    http_status=$(echo "$delete_response" | grep "HTTP_STATUS" | cut -d: -f2)

    if [[ "$http_status" == "204" || "$http_status" == "200" ]]; then
      echo "Successfully deleted application: $app_name"
    else
      echo "WARNING: Failed to delete application $app_name (HTTP status: $http_status)"
    fi
  done
}

echo ""
echo "================================================================"
echo "Starting insights test data cleanup..."
echo "================================================================"

# Delete all InsightsFilteringApp applications
delete_applications "InsightsFilteringApp1_"
delete_applications "InsightsFilteringApp2_"

echo ""
echo "================================================================"
echo "Cleanup completed successfully!"
echo "================================================================"
echo ""
