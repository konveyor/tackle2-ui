#!/bin/bash

# Hub User API Testing Script
# This script tests the Hub /users API endpoints

set -e

# Configuration
BASE_URL="${1:-https://tackle-konveyor-tackle.apps.mig08.rhos-psi.cnv-qe.rhood.us}"
HUB_URL="${BASE_URL}/hub"
USERNAME="${2:-admin}"
PASSWORD="${3:-Dog8code}"

echo "========================================="
echo "Hub User API Test Script"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "Hub URL: $HUB_URL"
echo "Username: $USERNAME"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Get authentication token
echo -e "${YELLOW}Step 1: Getting authentication token...${NC}"
TOKEN_RESPONSE=$(curl -k -s -X POST "${BASE_URL}/hub/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"user\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}" \
  -w "\n%{http_code}" 2>&1 || echo "")

HTTP_CODE=$(echo "$TOKEN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$TOKEN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
    # Try to extract token from response or cookies
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}Note: Token might be in cookies. Trying alternative auth...${NC}"
        # Try getting token from /auth/me or session
        TOKEN="use-session"
    fi
else
    echo -e "${RED}✗ Authentication failed (HTTP $HTTP_CODE)${NC}"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "Trying without explicit login (session-based)..."
    TOKEN=""
fi

echo ""

# Step 2: Get current user info
echo -e "${YELLOW}Step 2: Getting current user info (/hub/auth/me)...${NC}"
if [ -n "$TOKEN" ] && [ "$TOKEN" != "use-session" ]; then
    AUTH_ME=$(curl -k -s -X GET "${HUB_URL}/auth/me" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}")
else
    AUTH_ME=$(curl -k -s -X GET "${HUB_URL}/auth/me" \
      -H "Content-Type: application/json" \
      --user "${USERNAME}:${PASSWORD}" \
      -w "\n%{http_code}")
fi

HTTP_CODE=$(echo "$AUTH_ME" | tail -n1)
ME_BODY=$(echo "$AUTH_ME" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Got current user info${NC}"
    echo "$ME_BODY" | jq '.' 2>/dev/null || echo "$ME_BODY"
else
    echo -e "${RED}✗ Failed to get current user (HTTP $HTTP_CODE)${NC}"
    echo "$ME_BODY"
fi

echo ""

# Step 3: List all roles
echo -e "${YELLOW}Step 3: Listing all roles (/hub/roles)...${NC}"
if [ -n "$TOKEN" ] && [ "$TOKEN" != "use-session" ]; then
    ROLES=$(curl -k -s -X GET "${HUB_URL}/roles" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}")
else
    ROLES=$(curl -k -s -X GET "${HUB_URL}/roles" \
      -H "Content-Type: application/json" \
      --user "${USERNAME}:${PASSWORD}" \
      -w "\n%{http_code}")
fi

HTTP_CODE=$(echo "$ROLES" | tail -n1)
ROLES_BODY=$(echo "$ROLES" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Got roles list${NC}"
    echo "$ROLES_BODY" | jq '.' 2>/dev/null || echo "$ROLES_BODY"

    # Extract role IDs
    ADMIN_ROLE_ID=$(echo "$ROLES_BODY" | jq -r '.[] | select(.name=="tackle-admin") | .id' 2>/dev/null)
    ARCHITECT_ROLE_ID=$(echo "$ROLES_BODY" | jq -r '.[] | select(.name=="tackle-architect") | .id' 2>/dev/null)
    MIGRATOR_ROLE_ID=$(echo "$ROLES_BODY" | jq -r '.[] | select(.name=="tackle-migrator") | .id' 2>/dev/null)

    echo ""
    echo "Role IDs:"
    echo "  tackle-admin: $ADMIN_ROLE_ID"
    echo "  tackle-architect: $ARCHITECT_ROLE_ID"
    echo "  tackle-migrator: $MIGRATOR_ROLE_ID"
else
    echo -e "${RED}✗ Failed to get roles (HTTP $HTTP_CODE)${NC}"
    echo "$ROLES_BODY"
fi

echo ""

# Step 4: List all users
echo -e "${YELLOW}Step 4: Listing all users (/hub/users)...${NC}"
if [ -n "$TOKEN" ] && [ "$TOKEN" != "use-session" ]; then
    USERS=$(curl -k -s -X GET "${HUB_URL}/users" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}")
else
    USERS=$(curl -k -s -X GET "${HUB_URL}/users" \
      -H "Content-Type: application/json" \
      --user "${USERNAME}:${PASSWORD}" \
      -w "\n%{http_code}")
fi

HTTP_CODE=$(echo "$USERS" | tail -n1)
USERS_BODY=$(echo "$USERS" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Got users list${NC}"
    USER_COUNT=$(echo "$USERS_BODY" | jq '. | length' 2>/dev/null || echo "unknown")
    echo "Total users: $USER_COUNT"
    echo "$USERS_BODY" | jq '.[0:3]' 2>/dev/null || echo "$USERS_BODY" | head -20
else
    echo -e "${RED}✗ Failed to get users (HTTP $HTTP_CODE)${NC}"
    echo "$USERS_BODY"
fi

echo ""

# Step 5: Create a test user
TEST_USER_LOGIN="cypress-test-$(date +%s)"
TEST_USER_EMAIL="${TEST_USER_LOGIN}@example.com"
TEST_USER_PASSWORD="TestPass123!"

echo -e "${YELLOW}Step 5: Creating a test user...${NC}"
echo "Login: $TEST_USER_LOGIN"
echo "Email: $TEST_USER_EMAIL"

if [ -z "$MIGRATOR_ROLE_ID" ]; then
    echo -e "${YELLOW}Warning: Migrator role ID not found, using role ID 2${NC}"
    MIGRATOR_ROLE_ID=2
fi

CREATE_PAYLOAD=$(cat <<EOF
{
  "login": "$TEST_USER_LOGIN",
  "name": "Cypress Test User",
  "email": "$TEST_USER_EMAIL",
  "password": "$TEST_USER_PASSWORD",
  "roles": [{"id": $MIGRATOR_ROLE_ID}]
}
EOF
)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "use-session" ]; then
    CREATE_RESPONSE=$(curl -k -s -X POST "${HUB_URL}/users" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$CREATE_PAYLOAD" \
      -w "\n%{http_code}")
else
    CREATE_RESPONSE=$(curl -k -s -X POST "${HUB_URL}/users" \
      -H "Content-Type: application/json" \
      --user "${USERNAME}:${PASSWORD}" \
      -d "$CREATE_PAYLOAD" \
      -w "\n%{http_code}")
fi

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ User created successfully${NC}"
    echo "$CREATE_BODY" | jq '.' 2>/dev/null || echo "$CREATE_BODY"

    CREATED_USER_ID=$(echo "$CREATE_BODY" | jq -r '.id' 2>/dev/null)
    echo ""
    echo "Created user ID: $CREATED_USER_ID"
else
    echo -e "${RED}✗ Failed to create user (HTTP $HTTP_CODE)${NC}"
    echo "$CREATE_BODY"
    CREATED_USER_ID=""
fi

echo ""

# Step 6: Delete the test user
if [ -n "$CREATED_USER_ID" ] && [ "$CREATED_USER_ID" != "null" ]; then
    echo -e "${YELLOW}Step 6: Deleting test user (ID: $CREATED_USER_ID)...${NC}"

    if [ -n "$TOKEN" ] && [ "$TOKEN" != "use-session" ]; then
        DELETE_RESPONSE=$(curl -k -s -X DELETE "${HUB_URL}/users/${CREATED_USER_ID}" \
          -H "Authorization: Bearer ${TOKEN}" \
          -H "Content-Type: application/json" \
          -w "\n%{http_code}")
    else
        DELETE_RESPONSE=$(curl -k -s -X DELETE "${HUB_URL}/users/${CREATED_USER_ID}" \
          -H "Content-Type: application/json" \
          --user "${USERNAME}:${PASSWORD}" \
          -w "\n%{http_code}")
    fi

    HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" = "204" ]; then
        echo -e "${GREEN}✓ User deleted successfully${NC}"
    else
        echo -e "${RED}✗ Failed to delete user (HTTP $HTTP_CODE)${NC}"
        echo "$DELETE_RESPONSE" | sed '$d'
    fi
else
    echo -e "${YELLOW}Step 6: Skipping user deletion (no user ID)${NC}"
fi

echo ""
echo "========================================="
echo "Test completed!"
echo "========================================="
