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

import { button, MIN, SEC } from "../e2e/types/constants";

import {
  cancelButton,
  optionMenu,
  submitButton,
} from "../e2e/views/common.view";
import * as loginView from "../e2e/views/login.view";
import Chainable = Cypress.Chainable;

const fullUrl = Cypress.config("baseUrl") + "/applications";

export function inputText(fieldId: string, text: any, log = false): void {
  if (!log) {
    cy.log(`Type ${text} in ${fieldId}`);
  }
  cy.get(fieldId, { log, timeout: 2 * SEC })
    .clear({ log, timeout: 30 * SEC })
    .type(text, { log });
}

export function clearInput(fieldID: string): void {
  cy.get(fieldID, { timeout: 2 * SEC }).clear();
}

export function clickByText(
  fieldId: string,
  buttonText: string | RegExp,
  isForced = true,
  log = false
): void {
  if (!log) {
    cy.log(`Click by text, id: ${fieldId}, text: ${buttonText}`);
  }
  // https://github.com/cypress-io/cypress/issues/2000#issuecomment-561468114
  cy.contains(fieldId, buttonText, { timeout: 60 * SEC, log }).click({
    force: isForced,
    log,
  });
}

export function click(
  fieldId: string,
  isForced = true,
  log = false,
  number = 0
): void {
  if (!log) {
    cy.log(`Click ${fieldId}`);
  }
  cy.get(fieldId, { log, timeout: 30 * SEC })
    .eq(number)
    .click({ log, force: isForced });
}

export function clickWithFocus(
  fieldId: string,
  isForced = true,
  log = false,
  number = 0
): void {
  if (!log) {
    cy.log(`Click ${fieldId}`);
  }
  cy.get(fieldId, { log, timeout: 30 * SEC })
    .eq(number)
    .focus()
    .click({ log, force: isForced });
}

export function clickJs(
  fieldId: string,
  isForced = true,
  log = false,
  number = 0
): void {
  if (!log) {
    cy.log(`Click ${fieldId}`);
  }
  cy.get(fieldId, { log, timeout: 30 * SEC })
    .eq(number)
    .then(($obj) => {
      $obj[0].click();
    });
}

export function submitForm(): void {
  cy.get(submitButton, { timeout: 10 * SEC }).should("not.be.disabled");
  clickJs(submitButton);
}

export function cancelForm(): void {
  clickJs(cancelButton);
}

export function login(
  username: string = Cypress.env("user"),
  password: string = Cypress.env("pass"),
  firstLogin = false
): Chainable<null> {
  /**
   * The sessionId is used to create a new session or to try to recover a previous one
   */
  const sessionId = username + (firstLogin ? "FirstLogin" : "");

  cy.log(
    `login a new session or grab the currently logged in session [${sessionId}]`
  );
  return cy.session(sessionId, () => {
    cy.visit("/", { timeout: 120 * SEC });

    cy.uiEnvironmentConfig().then((env) => {
      if (env["AUTH_REQUIRED"] === "true") {
        cy.log("AUTH is enabled, logging in");

        // Wait up to 30 seconds for the userNameInput field to be visible on the page
        cy.get(loginView.userNameInput, { timeout: 30 * SEC }).should(
          "be.visible"
        );

        // Attempt login
        inputText(loginView.userNameInput, username);
        inputText(loginView.userPasswordInput, password);
        click(loginView.loginButton);

        // If login fails, try the initialPassword
        cy.get("body").then(($body) => {
          const txt = $body.find("*:contains('Invalid username or password')");
          if (txt.length > 0) {
            cy.log("Try logging in with the initial password");
            inputText(
              loginView.userPasswordInput,
              Cypress.env("initialPassword")
            );
            click(loginView.loginButton);
          }
        });

        // Update the password if it needs to be updated
        cy.get("body").then(($body) => {
          const txt = $body.find(
            "*:contains('You need to change your password')"
          );
          if (txt.length > 0) {
            cy.log("Attempting to change the password");
            inputText(loginView.changePasswordInput, password);
            inputText(loginView.confirmPasswordInput, password);
            click(loginView.submitButton);
          }
        });
      } else {
        cy.log("AUTH is disabled, just look for applications page");
      }

      // Should be past any auth steps needed, so wait for the url to become "/applications
      cy.url({ timeout: 1 * MIN }).should("eq", fullUrl);
    });
  });
}

export function logout(userName?: string): void {
  if (!userName) {
    userName = "admin";
  }
  clickByText(button, userName);
  cy.wait(0.5 * SEC);
  click("#logout");
  cy.get("h1", { timeout: 15 * SEC }).contains("Sign in to your account");
}

export function selectUserPerspective(userType: string): void {
  cy.get(optionMenu)
    .find(button, { timeout: 10 * SEC })
    .click();
  clickByText(button, userType);
}
