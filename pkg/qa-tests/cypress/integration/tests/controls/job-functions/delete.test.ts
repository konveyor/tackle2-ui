/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { JobFunctionsPage } from "../../../models/job-function";

describe("Delete job function", () => {
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

  it("Delete the only item available", () => {
    jobFunctionsPage.delete(0);

    // Verify table
    cy.get(
      ".pf-c-empty-state > .pf-c-empty-state__content > .pf-c-title"
    ).contains("No job functions available");
  });
});
