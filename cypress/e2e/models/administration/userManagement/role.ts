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
  permissions?: string[]; // Permission scopes like "addon.create", "application.delete"
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
        // Find the permission in the available (left) list
        cy.contains(userManagementView.permissionItem, permissionScope).click();
      });

      // Click "Add selected" button (right arrow)
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
      cy.wait(1000);
      notExists(this.name);
    } else {
      // Temporary: find button via span and click parent until OUIA ID is added to frontend
      cy.get(userManagementView.roleDialog).within(() => {
        cy.contains(userManagementView.roleDialogCreateButtonSpan, "Create")
          .parent("button")
          .should("be.visible")
          .should("not.be.disabled")
          .click();
      });

      // Wait for dialog to close
      cy.get(userManagementView.roleDialog).should("not.exist");
      cy.wait(1000);
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

    // Update instance with new data
    this.name = roleData.name;
    this.permissions = roleData.permissions || [];

    this.fillName();
    this.assignPermissions();

    if (cancel) {
      // Restore old values if cancelled
      this.name = oldValues.name;
      this.permissions = oldValues.permissions;
      clickByText(button, "Cancel");
    } else {
      // Save changes
      cy.get(userManagementView.roleDialog).within(() => {
        cy.contains(userManagementView.roleDialogCreateButtonSpan, "Save")
          .parent("button")
          .should("be.visible")
          .should("not.be.disabled")
          .click();
      });

      // Wait for dialog to close
      cy.get(userManagementView.roleDialog).should("not.exist");
      cy.wait(1000);
    }
    exists(this.name);
  }

  static duplicate(
    sourceRoleName: string,
    newRoleName: string,
    cancel = false
  ): Role {
    Role.openList();
    clickItemInKebabMenu(sourceRoleName, "Duplicate");

    cy.get(userManagementView.roleDialog, { timeout: 10 * SEC }).should(
      "be.visible"
    );

    // Clear the pre-filled name and enter new name
    cy.get(userManagementView.roleNameInput).clear().type(newRoleName);

    if (cancel) {
      clickByText(button, "Cancel");
      cy.wait(1000);
      notExists(newRoleName);
      return null;
    } else {
      // Save the duplicated role
      cy.get(userManagementView.roleDialog).within(() => {
        cy.contains(userManagementView.roleDialogCreateButtonSpan, "Create")
          .parent("button")
          .should("be.visible")
          .should("not.be.disabled")
          .click();
      });

      // Wait for dialog to close
      cy.get(userManagementView.roleDialog).should("not.exist");
      cy.wait(1000);
      exists(newRoleName);

      // Return a new Role instance (we don't know the permissions, but name is set)
      return new Role({ name: newRoleName, permissions: [] });
    }
  }

  delete(): void {
    Role.openList();
    clickItemInKebabMenu(this.name, "Delete");
    cy.wait(1000);
    notExists(this.name);
  }

  protected storeOldValues(): RoleData {
    return {
      name: this.name,
      permissions: [...this.permissions],
    };
  }

  /**
   * Delete a role via API
   */
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
      const role = roles.find((r: any) => r.name === name);
      if (role && role.id >= 1000) {
        // Only delete custom roles (id >= 1000)
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
