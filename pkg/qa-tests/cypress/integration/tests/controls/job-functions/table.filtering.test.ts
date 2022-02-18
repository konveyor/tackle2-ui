/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { JobFunctionsPage } from "../../../models/job-function";

describe("Filter job functions", () => {
  const jobFunctionsPage = new JobFunctionsPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data
    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "JobFunction");

      cy.log("").then(() => {
        [...Array(11)]
          .map((_, i) => ({
            role: `function-${(i + 10).toString(36)}`,
          }))
          .forEach((payload) => {
            cy.api_crud(tokens, "JobFunction", "POST", payload);
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
    jobFunctionsPage.openPage();

    // First filter
    jobFunctionsPage.applyFilter(filterIndex, "function-a");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("function-a");

    // Second filter
    jobFunctionsPage.applyFilter(filterIndex, "function-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("function-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("function-k");
  });
});
