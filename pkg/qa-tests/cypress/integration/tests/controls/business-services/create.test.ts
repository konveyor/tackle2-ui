/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { BusinessServicePage } from "../../../models/business-service";

describe("Create new business service", () => {
  const businessServicePage = new BusinessServicePage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");

      // Stakeholders for dropdown
      cy.log("").then(() => {
        return [...Array(3)]
          .map((_, i) => ({
            email: `email-${(i + 10).toString(36)}@domain.com`,
            displayName: `stakeholder-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            cy.api_crud(tokens, "Stakeholder", "POST", payload);
          });
      });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "BusinessService");
    });
  });

  it("With min data", () => {
    businessServicePage.create({
      name: "mybusinessservice",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "mybusinessservice");
  });

  it("With description", () => {
    businessServicePage.create({
      name: "mybusinessservice",
      description: "mydescription",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "mybusinessservice")
      .should("contain", "mydescription");
  });

  it("With owner", () => {
    businessServicePage.create({
      name: "mybusinessservice",
      owner: "stakeholder-a",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "mybusinessservice")
      .should("contain", "stakeholder-a");
  });
});
