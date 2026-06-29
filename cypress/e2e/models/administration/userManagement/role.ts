import {
  clickByText,
  clickItemInKebabMenu,
  exists,
  inputText,
  notExists,
  selectItemsPerPage,
  selectUserPerspective,
} from "../../../../utils/utils";
import { SEC, administration, button } from "../../../types/constants";
import * as commonView from "../../../views/common.view";
import * as userManagementView from "../../../views/user-management.view";

export interface RoleData {
  name: string;
  permissions?: string[];
}

export class Role {
  name: string;
  permissions: string[];
  id?: number;

  static fullUrl = Cypress.config("baseUrl") + "/users/roles";

  constructor(roleData: RoleData) {
    this.name = roleData.name;
    this.permissions = roleData.permissions || [];
  }

  static openList(itemsPerPage = 10, forceReload = false) {
    if (forceReload) {
      cy.visit(Role.fullUrl, { timeout: 35 * SEC }).then(() => {
        cy.get("h1", { timeout: 10 * SEC }).should("contain", "Roles");
      });
    } else {
      cy.url().then(($url) => {
        if ($url !== Role.fullUrl) {
          selectUserPerspective(administration);
          clickByText(commonView.navLink, "Roles");
          cy.get("h1", { timeout: 60 * SEC }).should("contain", "Roles");
        }
      });
    }

    if (itemsPerPage > 10) {
      selectItemsPerPage(itemsPerPage);
    }
  }

  protected fillName() {
    inputText(userManagementView.roleNameInput, this.name);
  }

  protected assignPermissions() {
    if (this.permissions.length > 0) {
      this.permissions.forEach((permissionScope) => {
        cy.contains(userManagementView.permissionItem, permissionScope).click();
      });

      cy.get(userManagementView.addSelectedButton).click();
    }
  }

  create(cancel = false) {
    Role.openList();
    cy.get(userManagementView.createRoleButton).click();

    cy.get(userManagementView.roleDialog, { timeout: 10 * SEC }).should(
      "be.visible"
    );

    this.fillName();
    this.assignPermissions();

    if (cancel) {
      clickByText(button, "Cancel");
      notExists(this.name);
    } else {
      cy.get(userManagementView.roleCreateButton).click();

      cy.get(userManagementView.roleDialog).should("not.exist");
      exists(this.name);
    }
  }

  edit(roleData: RoleData, cancel = false): void {
    const oldValues = this.storeOldValues();
    Role.openList();
    clickItemInKebabMenu(this.name, "Edit");

    cy.get(userManagementView.roleDialog, { timeout: 10 * SEC }).should(
      "be.visible"
    );

    this.name = roleData.name;
    this.permissions = roleData.permissions || [];

    this.fillName();
    this.assignPermissions();

    if (cancel) {
      this.name = oldValues.name;
      this.permissions = oldValues.permissions;
      clickByText(button, "Cancel");
    } else {
      cy.get(userManagementView.roleSaveButton).click();

      cy.get(userManagementView.roleDialog).should("not.exist");
    }
    exists(this.name);
  }

  static duplicate(
    sourceRoleName: string,
    newRoleName: string,
    cancel = false
  ): Cypress.Chainable<Role | null> {
    return cy
      .request({
        method: "GET",
        url: "/hub/roles",
      })
      .then((response) => {
        const roles = Array.isArray(response.body)
          ? response.body
          : response.body.data || [];
        const sourceRole = roles.find(
          (r: { name: string; permissions?: { name: string }[] }) =>
            r.name === sourceRoleName
        );
        const sourcePermissions = sourceRole?.permissions
          ? sourceRole.permissions.map((p: { name: string }) => p.name)
          : [];

        Role.openList();
        clickItemInKebabMenu(sourceRoleName, "Duplicate");

        cy.get(userManagementView.roleDialog, { timeout: 10 * SEC }).should(
          "be.visible"
        );

        cy.get(userManagementView.roleNameInput).clear().type(newRoleName);

        if (cancel) {
          clickByText(button, "Cancel");
          notExists(newRoleName);
          return null;
        } else {
          cy.get(userManagementView.roleCreateButton).click();

          cy.get(userManagementView.roleDialog).should("not.exist");
          exists(newRoleName);

          return new Role({
            name: newRoleName,
            permissions: sourcePermissions,
          });
        }
      });
  }

  delete(): void {
    Role.openList();
    clickItemInKebabMenu(this.name, "Delete");
    notExists(this.name);
  }

  protected storeOldValues(): RoleData {
    return {
      name: this.name,
      permissions: [...this.permissions],
    };
  }

  static deleteViaApi(name: string, headers?: Record<string, string>) {
    cy.request({
      method: "GET",
      url: "/hub/roles",
      ...(headers && { headers }),
    }).then((response) => {
      cy.log("Roles API response:", response.body);
      const roles = Array.isArray(response.body)
        ? response.body
        : response.body.data || [];
      const role = roles.find(
        (r: { name: string; id: number }) => r.name === name
      );
      if (role && role.id >= 1000) {
        cy.request({
          method: "DELETE",
          url: `/hub/roles/${role.id}`,
          ...(headers && { headers }),
        });
      }
    });
  }

  deleteViaApi(headers?: Record<string, string>) {
    Role.deleteViaApi(this.name, headers);
  }
}
