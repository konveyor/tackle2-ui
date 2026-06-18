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
  cancelForm,
  click,
  clickByText,
  clickItemInKebabMenu,
  exists,
  inputText,
  notExists,
  selectUserPerspective,
} from "../../../../utils/utils";
import {
  SEC,
  administration,
  button,
  userManagement,
  users,
} from "../../../types/constants";
import { OidcUserData } from "../../../types/types";
import * as commonView from "../../../views/common.view";
import * as userManagementView from "../../../views/user-management.view";

export class User {
  login = "";
  name = "";
  email = "";
  password = "";
  roles: string[] = [];
  id?: number;

  static fullUrl = Cypress.config("baseUrl") + "/users";

  constructor(userData: OidcUserData) {
    this.init(userData);
  }

  protected init(userData: OidcUserData) {
    const { login, name, email, password, roles } = userData;
    this.login = login;
    this.name = name;
    this.email = email;
    this.password = password;
    this.roles = roles || [];
  }

  static openList(forceReload = false) {
    if (forceReload) {
      cy.visit(User.fullUrl, { timeout: 35 * SEC }).then((_) => {
        cy.get("h1", { timeout: 10 * SEC }).should("contain", "Users");
      });
      return;
    }

    cy.url().then(($url) => {
      if ($url != User.fullUrl) {
        selectUserPerspective(administration);
        clickByText(commonView.navLink, userManagement);
        clickByText(userManagementView.usersSubmenuLink, users);
        cy.get("h1", { timeout: 60 * SEC }).should("contain", "Users");
      }
    });
  }

  protected fillLogin() {
    inputText(userManagementView.loginInput, this.login);
  }

  protected fillName() {
    inputText(userManagementView.nameInput, this.name);
  }

  protected fillEmail() {
    inputText(userManagementView.emailInput, this.email);
  }

  protected fillPassword() {
    inputText(userManagementView.passwordInput, this.password);
  }

  protected fillConfirmPassword() {
    inputText(userManagementView.confirmPasswordInput, this.password);
  }

  protected assignRoles() {
    if (this.roles.length > 0) {
      click(userManagementView.rolesSelectToggle);
      this.roles.forEach((role) => {
        clickByText(userManagementView.rolesMenuItem, role);
      });
      cy.get("body").click(0, 0);
    }
  }

  create(cancel = false) {
    User.openList();
    clickByText(button, "Create");

    this.fillLogin();
    this.fillName();
    this.fillEmail();
    this.fillPassword();
    this.fillConfirmPassword();
    this.assignRoles();

    if (cancel) {
      cancelForm();
      notExists(this.login);
    } else {
      click(userManagementView.createButton);
      exists(this.login);
    }
  }

  edit(userData: OidcUserData, cancel = false): void {
    const oldValues = this.storeOldValues();
    User.openList();
    clickItemInKebabMenu(this.login, "Edit");

    this.init(userData);

    this.fillName();
    this.fillEmail();

    if (userData.password) {
      this.fillPassword();
      this.fillConfirmPassword();
    }

    if (userData.roles && userData.roles.length > 0) {
      this.assignRoles();
    }

    if (cancel) {
      this.init(oldValues);
      cancelForm();
    } else {
      click(userManagementView.saveButton);
    }
    exists(this.login);
  }

  delete(): void {
    User.openList();
    clickItemInKebabMenu(this.login, "Delete");
  }

  protected storeOldValues(): OidcUserData {
    return {
      login: this.login,
      name: this.name,
      email: this.email,
      password: this.password,
      roles: [...this.roles],
    };
  }

  verifyRoles() {
    const rolesToVerify = [...this.roles];
    const userLogin = this.login;

    User.openList();

    cy.contains("td", userLogin)
      .parent("tr")
      .within(() => {
        rolesToVerify.forEach((role) => {
          cy.contains(role).should("exist");
        });
      });
  }

  static deleteViaApi(login: string, headers?: Record<string, string>) {
    cy.request({
      method: "GET",
      url: "/hub/users",
      ...(headers && { headers }),
    }).then((response) => {
      const users = response.body;
      const user = users.find(
        (u: { login: string; id: number }) => u.login === login
      );
      if (user) {
        cy.request({
          method: "DELETE",
          url: `/hub/users/${user.id}`,
          ...(headers && { headers }),
        });
      }
    });
  }

  deleteViaApi(headers?: Record<string, string>) {
    User.deleteViaApi(this.login, headers);
  }
}
