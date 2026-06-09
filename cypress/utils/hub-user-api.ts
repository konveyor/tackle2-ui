/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { HubRef, HubRole, HubUser } from "../e2e/types/types";

import { getAuthHeaders } from "./utils";

/**
 * Hub API User Management Utilities
 * These functions replace the old Keycloak UI-based user management
 */

const hubApiUrl = Cypress.config("baseUrl") + "/hub";

/**
 * Get all available roles from the Hub API
 */
export function getAllRoles(): Cypress.Chainable<HubRole[]> {
  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/roles`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);

        let roles = response.body;
        if (typeof roles === "string") {
          roles = JSON.parse(roles);
        }

        if (!Array.isArray(roles)) {
          throw new Error(
            `Expected roles to be an array, got: ${typeof roles}. Response: ${JSON.stringify(roles)}`
          );
        }

        return roles as HubRole[];
      });
  });
}

/**
 * Get a role by name
 */
export function getRoleByName(
  roleName: string
): Cypress.Chainable<HubRole | null> {
  return getAllRoles().then((roles) => {
    const role = roles.find((r) => r.name === roleName);
    return role || null;
  });
}

/**
 * Get role ID by role name
 */
export function getRoleId(roleName: string): Cypress.Chainable<number> {
  return getRoleByName(roleName).then((role) => {
    if (!role || !role.id) {
      throw new Error(`Role '${roleName}' not found`);
    }
    return role.id;
  });
}

/**
 * Create a user via Hub API
 */
export function createUser(userData: {
  login: string;
  name: string;
  email: string;
  password: string;
  roleIds?: number[];
}): Cypress.Chainable<HubUser> {
  const roles: HubRef[] = userData.roleIds
    ? userData.roleIds.map((id) => ({ id }))
    : [];

  const userPayload: Partial<HubUser> = {
    login: userData.login,
    name: userData.name,
    email: userData.email,
    password: userData.password,
    roles: roles,
  };

  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${hubApiUrl}/users`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: userPayload,
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 201) {
          let body = response.body;
          if (typeof body === "string") {
            body = JSON.parse(body);
          }
          return body as HubUser;
        } else {
          throw new Error(
            `Failed to create user '${userData.login}': ${response.status} - ${JSON.stringify(response.body)}`
          );
        }
      });
  });
}

/**
 * Create a user with a specific role name
 */
export function createUserWithRole(
  login: string,
  name: string,
  email: string,
  password: string,
  roleName: string
): Cypress.Chainable<HubUser> {
  return getRoleId(roleName).then((roleId) => {
    return createUser({
      login,
      name,
      email,
      password,
      roleIds: [roleId],
    });
  });
}

/**
 * Get all users
 */
export function getAllUsers(): Cypress.Chainable<HubUser[]> {
  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/users`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);

        let users = response.body;
        if (typeof users === "string") {
          users = JSON.parse(users);
        }

        if (!Array.isArray(users)) {
          throw new Error(
            `Expected users to be an array, got: ${typeof users}. Response: ${JSON.stringify(users)}`
          );
        }

        return users as HubUser[];
      });
  });
}

/**
 * Get a user by login name
 */
export function getUserByLogin(
  login: string
): Cypress.Chainable<HubUser | null> {
  return getAllUsers().then((users) => {
    const user = users.find((u) => u.login === login);
    return user || null;
  });
}

/**
 * Get user by ID
 */
export function getUserById(userId: number): Cypress.Chainable<HubUser> {
  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/users/${userId}`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        let body = response.body;
        if (typeof body === "string") {
          body = JSON.parse(body);
        }
        return body as HubUser;
      });
  });
}

/**
 * Update a user
 */
export function updateUser(
  userId: number,
  updates: Partial<HubUser>
): Cypress.Chainable<unknown> {
  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PUT",
        url: `${hubApiUrl}/users/${userId}`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: updates,
      })
      .then((response) => {
        expect(response.status).to.eq(204);
        cy.log(`User ${userId} updated successfully`);
      });
  });
}

/**
 * Delete a user by ID
 */
export function deleteUserById(userId: number): Cypress.Chainable<unknown> {
  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "DELETE",
        url: `${hubApiUrl}/users/${userId}`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 204) {
          cy.log(`User ${userId} deleted successfully`);
        } else if (
          response.status === 400 &&
          response.body?.includes("seeded")
        ) {
          cy.log(`Cannot delete seeded user ${userId} (ID < 1000)`);
          throw new Error(`Cannot delete seeded user ${userId}`);
        } else {
          throw new Error(
            `Failed to delete user ${userId}: ${response.status} - ${JSON.stringify(response.body)}`
          );
        }
      });
  });
}

/**
 * Delete a user by login name
 */
export function deleteUserByLogin(login: string): Cypress.Chainable<unknown> {
  return getUserByLogin(login).then((user) => {
    if (!user || !user.id) {
      cy.log(`User '${login}' not found, skipping deletion`);
      return;
    }
    return deleteUserById(user.id);
  });
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): Cypress.Chainable<{
  user?: HubUser;
  scopes?: string[];
}> {
  return getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/auth/me`,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body;
      });
  });
}
