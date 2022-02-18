/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { BusinessServicePage } from "../../../models/business-service";

describe("Delete business service", () => {
  const businessServicePage = new BusinessServicePage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "BusinessService");
      cy.api_crud(tokens, "BusinessService", "POST", {
        name: "service-a",
      });
    });
  });

  it("Delete the only item available", () => {
    businessServicePage.delete(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No business services available");
  });
});
