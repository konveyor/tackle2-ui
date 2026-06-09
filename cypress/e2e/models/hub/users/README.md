# Hub API User Management

These user management classes use the Hub API (`/hub/users`) instead of the deprecated Keycloak UI automation.

## Migration from Keycloak

**Old imports (deprecated):**

```typescript
import { User } from "../../keycloak/users/user";
import { UserMigrator } from "../../keycloak/users/userMigrator";
import { UserArchitect } from "../../keycloak/users/userArchitect";
```

**New imports:**

```typescript
import { User, UserMigrator, UserArchitect, UserAdmin } from "../../hub/users";
```

## Usage

### Basic User Creation

```typescript
import { UserMigrator, UserArchitect } from "../../hub/users";
import { data } from "../../../utils/data_utils";

describe("RBAC Tests", () => {
  const migrator = new UserMigrator(data.getRandomUserData());
  const architect = new UserArchitect(data.getRandomUserData());

  before(() => {
    // Create users
    migrator.create();
    architect.create();
  });

  after(() => {
    // Clean up
    migrator.delete();
    architect.delete();
  });

  it("Test as migrator", () => {
    migrator.login();
    // ... test actions ...
    migrator.logout();
  });

  it("Test as architect", () => {
    architect.login();
    // ... test actions ...
    architect.logout();
  });
});
```

### Using Hub API Utilities Directly

For advanced use cases, you can use the Hub API functions directly:

```typescript
import {
  createUserWithRole,
  deleteUserByLogin,
  getAllUsers,
  getRoleByName,
} from "../../../../utils/hub-user-api";

// Create a user with a specific role
createUserWithRole(
  "testuser",
  "Test User",
  "testuser@example.com",
  "password123",
  "tackle-migrator"
).then((user) => {
  cy.log(`Created user: ${user.login}`);
});

// Get all users
getAllUsers().then((users) => {
  cy.log(`Total users: ${users.length}`);
});

// Delete a user
deleteUserByLogin("testuser");

// Get role information
getRoleByName("tackle-architect").then((role) => {
  cy.log(`Role ID: ${role?.id}`);
});
```

## Available User Classes

- **User** - Base user class (no default role)
- **UserMigrator** - User with `tackle-migrator` role
- **UserArchitect** - User with `tackle-architect` role
- **UserAdmin** - User with `tackle-admin` role

## Available Hub API Functions

From `cypress/utils/hub-user-api.ts`:

### User Management

- `createUser(userData)` - Create a user with role IDs
- `createUserWithRole(login, name, email, password, roleName)` - Create a user with a role name
- `getAllUsers()` - Get all users
- `getUserByLogin(login)` - Find a user by login name
- `getUserById(userId)` - Get a user by ID
- `updateUser(userId, updates)` - Update a user
- `deleteUserById(userId)` - Delete a user by ID
- `deleteUserByLogin(login)` - Delete a user by login name
- `getCurrentUser()` - Get the currently authenticated user

### Role Management

- `getAllRoles()` - Get all available roles
- `getRoleByName(roleName)` - Find a role by name
- `getRoleId(roleName)` - Get a role ID by name

## Authentication

The Hub API functions automatically retrieve the authentication token from:

1. Browser cookies (preferred)
2. localStorage (fallback)

Make sure a user is logged in before creating/managing users via the API.

## Notes

- Seeded users (ID < 1000) cannot be deleted
- The `login` field is immutable after creation
- Passwords are hashed server-side and masked in responses
- All operations require the `users` scope (RBAC)

## TypeScript Types

Hub API types are defined in `cypress/e2e/types/types.ts`:

- `HubUser` - User resource
- `HubRole` - Role resource
- `HubPermission` - Permission resource
- `HubRef` - Foreign key reference
- `HubResource` - Base resource fields
- `HubAuthMe` - Current user response
