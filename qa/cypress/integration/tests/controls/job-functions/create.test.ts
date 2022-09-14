/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { JobFunctionsPage } from "../../../models/job-function";

describe("Create job function", () => {
  const jobFunctionsPage = new JobFunctionsPage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "JobFunction");
    });
  });

  it("With min data", () => {
    jobFunctionsPage.create({
      name: "myJobFunction",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Name']")
      .should("contain", "myJobFunction");
  });
});
