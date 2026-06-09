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

/**
 * Hub API User Management Utilities
 * These functions replace the old Keycloak UI-based user management
 */

const hubApiUrl = Cypress.config("baseUrl") + "/hub";

/**
 * Get authentication token from the current session
 * This assumes the user is already logged in via the UI
 */
function getAuthToken(): Cypress.Chainable<string> {
  return cy.getCookie("token").then((cookie): Cypress.Chainable<string> => {
    if (cookie && cookie.value) {
      return cy.wrap(cookie.value);
    }
    // Fallback: try to get token from localStorage or session
    return cy.window().then((win) => {
      const token = win.localStorage.getItem("token");
      if (token) {
        return token;
      }
      throw new Error("No authentication token found. Please login first.");
    });
  });
}

/**
 * Get all available roles from the Hub API
 */
export function getAllRoles(): Cypress.Chainable<HubRole[]> {
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/roles`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body as HubRole[];
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

  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "POST",
        url: `${hubApiUrl}/users`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: userPayload,
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status === 201) {
          cy.log(`User '${userData.login}' created successfully`);
          return response.body as HubUser;
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
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/users`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body as HubUser[];
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
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/users/${userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body as HubUser;
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
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "PUT",
        url: `${hubApiUrl}/users/${userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
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
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "DELETE",
        url: `${hubApiUrl}/users/${userId}`,
        headers: {
          Authorization: `Bearer ${token}`,
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
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: "GET",
        url: `${hubApiUrl}/auth/me`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body;
      });
  });
}
