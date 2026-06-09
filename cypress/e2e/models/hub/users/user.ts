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

import {
  createUserWithRole,
  deleteUserByLogin,
} from "../../../../utils/hub-user-api";
import { login, logout } from "../../../../utils/utils";
import { UserData } from "../../../types/types";

/**
 * User model using Hub API instead of Keycloak UI
 */
export class User {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  userEnabled: boolean;
  roles: string[];
  firstLogin: boolean;

  constructor(userData: UserData) {
    const {
      username,
      password,
      firstName,
      lastName,
      email,
      userEnabled,
      roles,
    } = userData;
    this.username = username;
    this.password = password;
    this.firstName = firstName || username;
    this.lastName = lastName || "";
    this.email = email || `${username}@example.com`;
    this.userEnabled = userEnabled ?? true;
    this.roles = roles || [];
    this.firstLogin = true;
  }

  /**
   * Get the full name of the user
   */
  get name(): string {
    return `${this.firstName} ${this.lastName}`.trim() || this.username;
  }

  /**
   * Create user via Hub API
   * This method should be overridden by subclasses to assign specific roles
   */
  create(): void {
    // Default implementation without roles
    // Subclasses should override to add specific roles
    cy.log(`Creating user: ${this.username}`);
  }

  /**
   * Create user with a specific role via Hub API
   */
  protected createWithRole(roleName: string): void {
    createUserWithRole(
      this.username,
      this.name,
      this.email,
      this.password,
      roleName
    ).then(() => {
      cy.log(`User '${this.username}' created with role '${roleName}'`);
      if (!this.roles.includes(roleName)) {
        this.roles.push(roleName);
      }
    });
  }

  /**
   * Delete user via Hub API
   */
  delete(): void {
    deleteUserByLogin(this.username).then(() => {
      cy.log(`User '${this.username}' deleted`);
    });
  }

  /**
   * Login as this user
   */
  login(): void {
    login(this.username, this.password, this.firstLogin);
    cy.visit("/");
  }

  /**
   * Logout current user
   */
  logout(): void {
    logout(this.username);
  }
}
