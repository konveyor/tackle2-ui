# Migration Guide: Keycloak to Hub User API

This guide explains how to migrate your Cypress tests from Keycloak UI-based user management to the new Hub API-based approach.

## Overview

With the removal of Keycloak and introduction of OIDC, user management now happens through the Hub's REST API (`/hub/users`) instead of automating the Keycloak admin console.

## Quick Migration Checklist

### 1. Update Imports

**Before:**

```typescript
import { User } from "../../models/keycloak/users/user";
import { UserArchitect } from "../../models/keycloak/users/userArchitect";
import { UserMigrator } from "../../models/keycloak/users/userMigrator";
```

**After:**

```typescript
import { User, UserArchitect, UserMigrator } from "../../models/hub/users";
```

### 2. Remove Keycloak Admin Login

**Before:**

```typescript
before("Create test data", function () {
  User.loginKeycloakAdmin(); // ❌ Remove this
  architect.create();
  migrator.create();

  login(); // Admin login
});
```

**After:**

```typescript
before("Create test data", function () {
  login(); // Admin login first to get auth token
  architect.create();
  migrator.create();
});
```

### 3. Update User Creation Pattern

The `create()` method now uses Hub API instead of UI automation. The interface remains the same:

```typescript
const migrator = new UserMigrator(data.getRandomUserData());
migrator.create(); // Creates user via POST /hub/users
migrator.delete(); // Deletes user via DELETE /hub/users/{id}
```

## Complete Example Migration

### Before (Keycloak-based)

```typescript
import { User } from "../../models/keycloak/users/user";
import { UserArchitect } from "../../models/keycloak/users/userArchitect";
import { UserMigrator } from "../../models/keycloak/users/userMigrator";
import * as data from "../../../utils/data_utils";
import { login } from "../../../utils/utils";

describe("RBAC Test", () => {
  const architect = new UserArchitect(data.getRandomUserData());
  const migrator = new UserMigrator(data.getRandomUserData());

  before("Create users", () => {
    User.loginKeycloakAdmin(); // Navigate to Keycloak admin console
    architect.create(); // Create via UI clicks
    migrator.create(); // Create via UI clicks

    login(); // Go back to main app
  });

  it("Test as architect", () => {
    architect.login();
    // ... test code ...
    architect.logout();
  });

  after("Cleanup", () => {
    User.loginKeycloakAdmin();
    architect.delete();
    migrator.delete();
  });
});
```

### After (Hub API-based)

```typescript
import { UserArchitect, UserMigrator } from "../../models/hub/users";
import * as data from "../../../utils/data_utils";
import { login } from "../../../utils/utils";

describe("RBAC Test", () => {
  const architect = new UserArchitect(data.getRandomUserData());
  const migrator = new UserMigrator(data.getRandomUserData());

  before("Create users", () => {
    login(); // Login as admin to get auth token
    architect.create(); // Create via POST /hub/users
    migrator.create(); // Create via POST /hub/users
  });

  it("Test as architect", () => {
    architect.login();
    // ... test code ...
    architect.logout();
  });

  after("Cleanup", () => {
    login(); // Login as admin to delete users
    architect.delete();
    migrator.delete();
  });
});
```

## Key Changes

1. **No more Keycloak UI navigation** - All user operations now use REST API
2. **Admin login required first** - Need to `login()` as admin to get auth token before creating users
3. **Same class interface** - The `create()`, `delete()`, `login()`, `logout()` methods work the same way
4. **Faster execution** - API calls are much faster than UI automation
5. **More reliable** - No UI element waiting or timing issues

## Advanced Usage

If you need more control, use the Hub API utilities directly:

```typescript
import {
  createUserWithRole,
  deleteUserByLogin,
  getAllUsers,
  getRoleByName,
} from "../../../utils/hub-user-api";

// Create a user with custom role
createUserWithRole(
  "customuser",
  "Custom User",
  "custom@example.com",
  "password123",
  "tackle-architect"
);

// Query users
getAllUsers().then((users) => {
  cy.log(`Total users: ${users.length}`);
});

// Delete by login name
deleteUserByLogin("customuser");
```

## Common Issues

### Issue: "No authentication token found"

**Solution:** Make sure to call `login()` before creating/deleting users

```typescript
before(() => {
  login(); // Required!
  user.create();
});
```

### Issue: "Cannot delete seeded user"

**Solution:** Seeded users (ID < 1000) cannot be deleted. These are built-in system users.

### Issue: User creation fails with 400/401

**Solution:** Verify that:

1. Admin user is logged in
2. Admin user has the `users` scope
3. RBAC is properly configured

## Files to Update

Search for these patterns in your test files:

```bash
# Find tests using old Keycloak imports
grep -r "from.*keycloak/users" cypress/e2e/tests/

# Find Keycloak admin login calls
grep -r "loginKeycloakAdmin" cypress/e2e/tests/
```

Update each file following the patterns in this guide.

## New Capabilities

The Hub API provides additional features not available with Keycloak UI automation:

- Get current user info: `getCurrentUser()`
- Query all roles: `getAllRoles()`
- Update users: `updateUser(userId, updates)`
- Find users by login: `getUserByLogin(login)`

See `cypress/utils/hub-user-api.ts` for the complete API.
