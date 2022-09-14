/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { JobFunctionsPage } from "../../../models/job-function";

describe("Sort job functions", () => {
  const jobFunctionsPage = new JobFunctionsPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data
    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "JobFunction");

      [...Array(11)]
        .map((_, i) => ({
          role: `function-${(i + 10).toString(36)}`,
        }))
        .forEach((payload) => {
          cy.api_crud(tokens, "JobFunction", "POST", payload);
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("Sort by name", () => {
    const columnName = "Name";
    jobFunctionsPage.openPage();

    // Asc is the default
    cy.get(".pf-c-table").pf4_table_column_isAsc(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("function-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("function-j");

    // Desc
    jobFunctionsPage.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("function-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("function-b");
  });
});
