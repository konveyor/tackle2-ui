/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { JobFunctionsPage } from "../../../models/job-function";

describe("Edit job function", () => {
  const jobFunctionsPage = new JobFunctionsPage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "JobFunction");
      cy.api_crud(tokens, "JobFunction", "POST", {
        role: "function-a",
      });
    });
  });

  it("Edit name", () => {
    jobFunctionsPage.edit(0, {
      name: "newName",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Name']")
      .should("contain", "newName");
  });
});
