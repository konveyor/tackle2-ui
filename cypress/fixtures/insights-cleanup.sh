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

auth_response=$(curl -kSs -w "\n%{http_code}" -d "{\"user\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}" \
  "${host}/auth/login")

http_code=$(echo "$auth_response" | tail -n1)
response_body=$(echo "$auth_response" | sed '$d')

if [[ "$http_code" != "200" && "$http_code" != "201" ]]; then
  echo "ERROR: Authentication failed with HTTP $http_code" >&2
  exit 1
fi

TOKEN=$(echo "$response_body" | jq -r ".token")

if [[ "$TOKEN" == "null" ]]; then
  echo "ERROR: Authentication response missing token field" >&2
  exit 1
fi

# If token is empty, verify auth is actually disabled by testing API access
if [[ -z "$TOKEN" ]]; then
  test_response=$(curl -kSs -w "\n%{http_code}" "${host}/applications")
  test_code=$(echo "$test_response" | tail -n1)

  if [[ "$test_code" == "401" || "$test_code" == "403" ]]; then
    echo "ERROR: Authentication required but token is empty" >&2
    echo "The server requires authentication but returned an empty token." >&2
    echo "Please check your credentials (USERNAME, PASSWORD) or server configuration." >&2
    exit 1
  fi
fi

export TOKEN

# Function to delete applications by name pattern
delete_applications() {
  local pattern="$1"
  echo "Searching for applications matching pattern: $pattern"

  apps=$(curl -kSs -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
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
      -H "Authorization: Bearer ${TOKEN}" \
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
