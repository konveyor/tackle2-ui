import { click, getColumnText, login } from "../../../../utils/utils";
import { Role } from "../../../models/administration/userManagement/role";
import * as commonView from "../../../views/common.view";

describe(["@authNeeded"], "Role management tests", () => {
  before("Login as admin", () => {
    login();
  });

  it("Should create and delete a custom role without permissions", function () {
    const role = new Role({
      name: `Test Custom Role ${Date.now()}`,
      scopes: [],
    });

    role.create();
    cy.contains("td", role.name).should("exist");
    role.delete();
  });

  it("Should create, edit, and delete a role with specific scopes", function () {
    const suffix = Date.now();
    const role = new Role({
      name: `Role with Scopes ${suffix}`,
      scopes: ["addons:post", "applications:get"],
    });
    role.create();

    cy.contains("td", role.name).should("exist");

    cy.contains("td", role.name)
      .parent("tr")
      .within(() => {
        cy.contains("2").should("exist");
      });

    role.edit({
      name: `Updated Role Name ${suffix}`,
      scopes: ["applications:delete", "tasks:get", "buckets:post"],
    });

    cy.contains("td", role.name).should("exist");

    getColumnText(role.name, "Scopes").then((text) => {
      expect(text).to.equal("5");
    });
    role.deleteViaApi();
  });

  it("Should duplicate migrator role with same permissions", function () {
    const duplicatedRoleName = `Duplicated Migrator Role ${Date.now()}`;
    Role.openList(100);

    let originalPermissionCount: string;
    getColumnText("migrator", "Scopes").then((text) => {
      originalPermissionCount = text;
    });

    Role.duplicate("migrator", duplicatedRoleName).then((duplicatedRole) => {
      cy.contains("td", duplicatedRoleName).should("exist");

      getColumnText(duplicatedRoleName, "Scopes").then((text) => {
        expect(text).to.equal(originalPermissionCount);
      });

      duplicatedRole?.deleteViaApi();
    });
  });

  it("Should not allow editing or deleting built-in roles", function () {
    const builtInRoles = ["admin", "architect", "migrator", "project-manager"];

    Role.openList(100);

    builtInRoles.forEach((roleName) => {
      cy.contains("td", roleName)
        .closest("tr")
        .within(() => {
          click(commonView.kebabToggleButton);
        });

      cy.get('[role="menu"]').within(() => {
        cy.get("span.pf-v6-c-menu__item-text")
          .contains("Edit")
          .closest("button")
          .should("have.attr", "aria-disabled", "true");
        cy.get("span.pf-v6-c-menu__item-text")
          .contains("Delete")
          .closest("button")
          .should("have.attr", "aria-disabled", "true");
      });

      cy.get("h1").click();
    });
  });
});
