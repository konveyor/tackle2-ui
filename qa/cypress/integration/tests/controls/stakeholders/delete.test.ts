/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { StakeholderPage } from "../../../models/stakeholder";

describe("Delete stakeholder", () => {
  const stakeholder = new StakeholderPage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_crud(tokens, "Stakeholder", "POST", {
        email: "email-a@domain.com",
        displayName: "stakeholder-a",
      });
    });
  });

  it("Delete the only item available", () => {
    stakeholder.delete(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No stakeholders available");
  });
});
