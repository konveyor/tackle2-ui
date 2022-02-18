/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationPage } from "../../../models/application";

describe("Application dependencies", () => {
  const applicationPage = new ApplicationPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Application");
      cy.log("").then(() => {
        return [...Array(5)]
          .map((_, i) => ({
            name: `application-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            cy.api_crud(tokens, "Application", "POST", payload);
          });
      });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Clean dependencies
    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "ApplicationsDependency");
    });
  });

  it("Add north and south dependencies", () => {
    applicationPage.manageDependencies(2, [
      { type: "north", application: "application-a", operation: "add" },
      { type: "north", application: "application-b", operation: "add" },
      { type: "south", application: "application-d", operation: "add" },
      { type: "south", application: "application-e", operation: "add" },
    ]);

    cy.get(".pf-c-form__group-control .pf-c-chip-group")
      .eq(0)
      .pf4_chip_group_chips()
      .should("contain", "application-a")
      .should("contain", "application-b");
    cy.get(".pf-c-form__group-control .pf-c-chip-group")
      .eq(1)
      .pf4_chip_group_chips()
      .should("contain", "application-d")
      .should("contain", "application-e");
  });

  it("Add dependencies and then move all to north", () => {
    applicationPage.manageDependencies(2, [
      { type: "north", application: "application-a", operation: "add" },
      { type: "north", application: "application-b", operation: "add" },
      { type: "south", application: "application-d", operation: "add" },
      { type: "south", application: "application-e", operation: "add" },

      // Remove
      { type: "south", application: "application-d", operation: "remove" },
      { type: "south", application: "application-e", operation: "remove" },

      // Add
      { type: "north", application: "application-d", operation: "add" },
      { type: "north", application: "application-e", operation: "add" },
    ]);

    cy.get("button.pf-m-overflow").click();

    cy.get(".pf-c-form__group-control .pf-c-chip-group")
      .eq(0)
      .pf4_chip_group_chips()
      .should("contain", "application-a")
      .should("contain", "application-b")
      .should("contain", "application-d")
      .should("contain", "application-e");
  });

  it("Application circle dependency", () => {
    applicationPage.manageDependencies(2, [
      { type: "north", application: "application-a", operation: "add" },
      { type: "south", application: "application-a", operation: "add" },
    ]);

    cy.get(".pf-c-form__group-control > .pf-m-error").contains(
      "Dependencies cycle created"
    );
  });
});
