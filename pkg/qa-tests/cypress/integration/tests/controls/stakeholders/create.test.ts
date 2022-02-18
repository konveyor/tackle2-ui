/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { StakeholderPage } from "../../../models/stakeholder";

describe("Create new business service", () => {
  const stakeholder = new StakeholderPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_clean(tokens, "JobFunction");
      cy.api_clean(tokens, "StakeholderGroup");

      cy.log("")
        .then(() => {
          // Job functions for dropdown
          return [
            {
              role: "Business Analyst",
            },
            {
              role: "Consultant",
            },
            {
              role: "DBA",
            },
          ].forEach((payload) => {
            cy.api_crud(tokens, "JobFunction", "POST", payload);
          });
        })
        .then(() => {
          // Stakeholders groups for dropdown
          return [...Array(3)]
            .map((_, i) => ({
              name: `group-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "StakeholderGroup", "POST", payload);
            });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
    });
  });

  it("With min data", () => {
    stakeholder.create({
      email: "aaa@domain.com",
      displayName: "myDisplayName",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "aaa@domain.com")
      .should("contain", "myDisplayName");
  });

  it("With job function", () => {
    stakeholder.create({
      email: "aaa@domain.com",
      displayName: "myDisplayName",
      jobFunction: "Business Analyst",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "aaa@domain.com")
      .should("contain", "myDisplayName")
      .should("contain", "Business Analyst");
  });

  it("With group", () => {
    stakeholder.create({
      email: "aaa@domain.com",
      displayName: "myDisplayName",
      groups: ["group-a", "group-b"],
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "aaa@domain.com")
      .should("contain", "myDisplayName")
      .should("contain", "2");
  });
});
