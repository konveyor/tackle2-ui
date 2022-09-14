/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { BusinessServicePage } from "../../../models/business-service";

describe("Filter business services", () => {
  const bussinessServicePage = new BusinessServicePage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data
    const stakeholders = [];

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_clean(tokens, "BusinessService");

      cy.log("")
        .then(() => {
          // Create stakeholders
          return [...Array(11)]
            .map((_, i) => ({
              email: `email-${(i + 10).toString(36)}@domain.com`,
              displayName: `stakeholder-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Stakeholder", "POST", payload).then((data) =>
                stakeholders.push(data)
              );
            });
        })
        .then(() => {
          // Create business services
          return [...Array(11)]
            .map((_, i) => ({
              name: `service-${(i + 10).toString(36)}`,
              description: `description-${(i + 10).toString(36)}`,
              owner: stakeholders[i],
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "BusinessService", "POST", payload);
            });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("By name", () => {
    const filterIndex = 0;
    bussinessServicePage.openPage();

    // First filter
    bussinessServicePage.applyFilter(0, "service-a");

    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(filterIndex)
      .contains("service-a");

    // Second filter
    bussinessServicePage.applyFilter(filterIndex, "service-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("service-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("service-k");
  });

  it("By description", () => {
    const filterIndex = 1;
    bussinessServicePage.openPage();

    // First filter
    bussinessServicePage.applyFilter(filterIndex, "description-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("description-a");

    // Second filter
    bussinessServicePage.applyFilter(filterIndex, "description-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("description-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("description-k");
  });

  it("By owner", () => {
    const filterIndex = 2;
    bussinessServicePage.openPage();

    // First filter
    bussinessServicePage.applyFilter(filterIndex, "stakeholder-j");
    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-j");
  });
});
