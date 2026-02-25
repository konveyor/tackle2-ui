#!/bin/bash

set -e

# Script to cleanup issues data created by issues.sh

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
  echo "ERROR: Failed to obtain authentication token"
  exit 1
fi

echo "Authenticated successfully"
echo "Cleaning up issues test data..."

# Delete applications by name pattern
for i in {0..2}; do
  app_name="IssuesFilteringApp1_${i}"
  echo "Looking for application: ${app_name}"

  # Get application by name
  app_response=$(curl -kSs -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/applications?name=${app_name}")

  app_id=$(echo $app_response | jq -r '.[0].id // empty')

  if [[ -n "$app_id" && "$app_id" != "null" ]]; then
    echo "  Deleting application: ${app_name} (ID: ${app_id})"
    curl -kSs -X DELETE \
      -H "Authorization: Bearer ${TOKEN}" \
      "${host}/applications/${app_id}"
    echo "  Deleted ${app_name}"
  else
    echo "  Application ${app_name} not found (may have been deleted already)"
  fi
done

app_name="IssuesFilteringApp2_0"
echo "Looking for application: ${app_name}"

app_response=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/applications?name=${app_name}")

app_id=$(echo $app_response | jq -r '.[0].id // empty')

if [[ -n "$app_id" && "$app_id" != "null" ]]; then
  echo "  Deleting application: ${app_name} (ID: ${app_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/applications/${app_id}"
  echo "  Deleted ${app_name}"
else
  echo "  Application ${app_name} not found (may have been deleted already)"
fi

# Delete archetype
echo ""
echo "Cleaning up archetype..."
archetype_response=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/archetypes")

archetype_id=$(echo $archetype_response | jq -r '.[] | select(.name=="IssuesArchetype") | .id // empty')

if [[ -n "$archetype_id" && "$archetype_id" != "null" ]]; then
  echo "  Deleting archetype: IssuesArchetype (ID: ${archetype_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/archetypes/${archetype_id}"
  echo "  Deleted IssuesArchetype"
else
  echo "  IssuesArchetype not found"
fi

# Delete business services
echo ""
echo "Cleaning up business services..."
bs_response=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/businessservices")

bs1_id=$(echo $bs_response | jq -r '.[] | select(.name=="BookServer Business Service") | .id // empty')
bs2_id=$(echo $bs_response | jq -r '.[] | select(.name=="Coolstore Business Service") | .id // empty')

if [[ -n "$bs1_id" && "$bs1_id" != "null" ]]; then
  echo "  Deleting business service: BookServer Business Service (ID: ${bs1_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/businessservices/${bs1_id}"
  echo "  Deleted BookServer Business Service"
else
  echo "  BookServer Business Service not found"
fi

if [[ -n "$bs2_id" && "$bs2_id" != "null" ]]; then
  echo "  Deleting business service: Coolstore Business Service (ID: ${bs2_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/businessservices/${bs2_id}"
  echo "  Deleted Coolstore Business Service"
else
  echo "  Coolstore Business Service not found"
fi

# Delete stakeholder groups
echo ""
echo "Cleaning up stakeholder groups..."
shg_response=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/stakeholdergroups")

shg1_id=$(echo $shg_response | jq -r '.[] | select(.name=="Issues StakeholderGroup 1") | .id // empty')
shg2_id=$(echo $shg_response | jq -r '.[] | select(.name=="Issues StakeholderGroup 2") | .id // empty')

if [[ -n "$shg1_id" && "$shg1_id" != "null" ]]; then
  echo "  Deleting stakeholder group: Issues StakeholderGroup 1 (ID: ${shg1_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/stakeholdergroups/${shg1_id}"
  echo "  Deleted Issues StakeholderGroup 1"
else
  echo "  Issues StakeholderGroup 1 not found"
fi

if [[ -n "$shg2_id" && "$shg2_id" != "null" ]]; then
  echo "  Deleting stakeholder group: Issues StakeholderGroup 2 (ID: ${shg2_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/stakeholdergroups/${shg2_id}"
  echo "  Deleted Issues StakeholderGroup 2"
else
  echo "  Issues StakeholderGroup 2 not found"
fi

# Delete stakeholders
echo ""
echo "Cleaning up stakeholders..."
sh_response=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/stakeholders")

sh1_id=$(echo $sh_response | jq -r '.[] | select(.email=="stakeholder1@issues.test") | .id // empty')
sh2_id=$(echo $sh_response | jq -r '.[] | select(.email=="stakeholder2@issues.test") | .id // empty')

if [[ -n "$sh1_id" && "$sh1_id" != "null" ]]; then
  echo "  Deleting stakeholder: stakeholder1@issues.test (ID: ${sh1_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/stakeholders/${sh1_id}"
  echo "  Deleted stakeholder1@issues.test"
else
  echo "  stakeholder1@issues.test not found"
fi

if [[ -n "$sh2_id" && "$sh2_id" != "null" ]]; then
  echo "  Deleting stakeholder: stakeholder2@issues.test (ID: ${sh2_id})"
  curl -kSs -X DELETE \
    -H "Authorization: Bearer ${TOKEN}" \
    "${host}/stakeholders/${sh2_id}"
  echo "  Deleted stakeholder2@issues.test"
else
  echo "  stakeholder2@issues.test not found"
fi

echo ""
echo "Note: Tags are not deleted (using existing tags)"

echo ""
echo "===================================="
echo "Cleanup completed successfully!"
echo "===================================="
