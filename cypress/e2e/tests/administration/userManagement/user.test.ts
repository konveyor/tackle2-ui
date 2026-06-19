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
/// <reference types="cypress" />

import { getRandomOidcUserData } from "../../../../utils/data_utils";
import { exists, login, logout, notExists } from "../../../../utils/utils";
import { User } from "../../../models/administration/userManagement/user";

describe(["@tier0", "@tier0_authNeeded"], "User CRUD operations", () => {
  let authEnabled = false;

  before("Check if auth is enabled and login", () => {
    cy.uiEnvironmentConfig().then((env) => {
      authEnabled = env["AUTH_REQUIRED"] === "true";
      if (authEnabled) {
        login();
      }
    });
  });

  it("Create, edit, and delete user with login verification", function () {
    if (!authEnabled) {
      this.skip();
    }
    const userData = getRandomOidcUserData();
    userData.roles = ["migrator"];
    const user = new User(userData);

    user.create();
    user.verifyRoles();

    logout();

    // Verify created user can login successfully
    login(userData.login, userData.password);
    cy.visit("/applications");
    cy.url({ timeout: 30000 }).should("include", "/applications");
    logout(userData.login);

    login(); // as admin
    cy.visit("/");

    const updatedUserData = getRandomOidcUserData();
    updatedUserData.login = userData.login;
    updatedUserData.roles = ["architect"];

    user.edit(updatedUserData);
    exists(user.login);
    user.verifyRoles();

    user.delete();
    notExists(user.login);

    logout();

    // Clear Cypress session cache to force fresh login attempt for deleted user
    cy.then(() => {
      Cypress.session.clearAllSavedSessions();
    });

    // Attempt to login as deleted user should fail and stay on login page
    cy.visit("/", { timeout: 120000 });
    cy.get("#login").type(userData.login);
    cy.get("#password").type(userData.password);
    cy.get('button[type="submit"]').click();

    // Verify user stays on login page (login failed)
    cy.url({ timeout: 10000 }).should("include", "/oidc/login");

    login();
  });
});
