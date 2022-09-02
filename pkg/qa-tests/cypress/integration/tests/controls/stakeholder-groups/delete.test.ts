/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { StakeholderGroupPage } from "../../../models/stakeholder-group";

describe("Delete business service", () => {
  const stakeholderGroupPage = new StakeholderGroupPage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "StakeholderGroup");
      cy.api_crud(tokens, "StakeholderGroup", "POST", {
        name: "group-a",
      });
    });
  });

  it("Delete the only item available", () => {
    stakeholderGroupPage.delete(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No stakeholder groups available");
  });
});
