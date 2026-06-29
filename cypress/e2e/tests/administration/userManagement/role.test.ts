import { click, getColumnText, login } from "../../../../utils/utils";
import { Role } from "../../../models/administration/userManagement/role";
import * as commonView from "../../../views/common.view";

describe(["@tier1"], "Role management tests", () => {
  before("Login as admin", () => {
    login();
  });

  it("Should create and delete a custom role without permissions", function () {
    const role = new Role({
      name: "Test Custom Role",
      permissions: [],
    });

    role.create();
    cy.contains("td", "Test Custom Role").should("exist");
    role.delete();
  });

  it("Should create, edit, and delete a role with specific permissions", function () {
    const role = new Role({
      name: "Role with Permissions",
      permissions: ["addons:post", "applications:get"],
    });
    role.create();

    cy.contains("td", "Role with Permissions").should("exist");

    // Verify the role has 2 permissions (shown in the Permissions column)
    cy.contains("td", "Role with Permissions")
      .parent("tr")
      .within(() => {
        cy.contains("2").should("exist");
      });

    // Edit role - change name and add more permissions
    role.edit({
      name: "Updated Role Name",
      permissions: ["applications:delete", "tasks:get", "buckets:post"],
    });

    // Verify updated role appears in the list
    cy.contains("td", "Updated Role Name").should("exist");

    // Verify the role now has 5 permissions (2 original + 3 new)
    getColumnText("Updated Role Name", "Permissions").then((text) => {
      expect(text).to.equal("5");
    });
    role.deleteViaApi();
  });

  it("Should duplicate migrator role with same permissions", function () {
    const duplicatedRoleName = "Duplicated Migrator Role";
    Role.openList(100);

    // Get the permission count of the original migrator role
    let originalPermissionCount: string;
    getColumnText("migrator", "Permissions").then((text) => {
      originalPermissionCount = text;
    });

    // Duplicate the migrator role
    const duplicatedRole = Role.duplicate("migrator", duplicatedRoleName);
    cy.contains("td", duplicatedRoleName).should("exist");

    // Verify the duplicated role has the same number of permissions as the original
    getColumnText(duplicatedRoleName, "Permissions").then((text) => {
      expect(text).to.equal(originalPermissionCount);
    });

    // Cleanup
    duplicatedRole.deleteViaApi();
  });

  it("Should not allow editing or deleting built-in roles", function () {
    const builtInRoles = ["admin", "architect", "migrator", "project-manager"];

    Role.openList(100);

    builtInRoles.forEach((roleName) => {
      // Open kebab menu for built-in role
      cy.contains("td", roleName)
        .closest("tr")
        .within(() => {
          click(commonView.kebabToggleButton);
        });

      // Verify Edit and Delete options are disabled (greyed out)
      cy.get("span.pf-v6-c-menu__item-text")
        .contains("Edit")
        .closest("button")
        .should("have.attr", "aria-disabled", "true");
      cy.get("span.pf-v6-c-menu__item-text")
        .contains("Delete")
        .closest("button")
        .should("have.attr", "aria-disabled", "true");

      // Close the kebab menu by clicking elsewhere
      cy.get("h1").click();
    });
  });
});
