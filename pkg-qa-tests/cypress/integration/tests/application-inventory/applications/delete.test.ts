/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { ApplicationPage } from "../../../models/application";

describe("Delete application", () => {
  const application = new ApplicationPage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Application");
      cy.api_crud(tokens, "Application", "POST", {
        name: "application-a",
      });
    });
  });

  it("Delete the only item available", () => {
    application.delete(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No applications available");
  });
});
