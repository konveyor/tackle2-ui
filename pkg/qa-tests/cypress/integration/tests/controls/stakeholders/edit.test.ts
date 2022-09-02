/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { StakeholderPage } from "../../../models/stakeholder";

describe("Edit stakeholder", () => {
  const stakeholder = new StakeholderPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_clean(tokens, "JobFunction");
      cy.api_clean(tokens, "StakeholderGroup");

      const stakeholderGroups = [];

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
              cy.api_crud(
                tokens,
                "StakeholderGroup",
                "POST",
                payload
              ).then((responseData) => stakeholderGroups.push(responseData));
            });
        })
        .then(() => {
          // Stakeholder to edit
          cy.api_crud(tokens, "Stakeholder", "POST", {
            email: "email-a@domain.com",
            displayName: "stakeholder-a",
            stakeholderGroups: stakeholderGroups.slice(0, 1),
          });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("Email and displayName", () => {
    stakeholder.edit(0, {
      email: "newEmail@domain.com",
      displayName: "newDisplayName",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newEmail@domain.com")
      .should("contain", "newDisplayName");
  });

  it("Job function", () => {
    stakeholder.edit(0, {
      email: "newEmail@domain.com",
      displayName: "newDisplayName",
      jobFunction: "Business Analyst",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newEmail@domain.com")
      .should("contain", "newDisplayName")
      .should("contain", "Business Analyst");

    // Edit again
    stakeholder.edit(0, {
      email: "newEmail@domain.com",
      displayName: "newDisplayName",
      jobFunction: "Consultant",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newEmail@domain.com")
      .should("contain", "newDisplayName")
      .should("contain", "Consultant");
  });

  it("Group", () => {
    stakeholder.edit(0, {
      email: "newEmail@domain.com",
      displayName: "newDisplayName",
      groups: ["group-b", "group-c"],
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newEmail@domain.com")
      .should("contain", "newDisplayName")
      .should("contain", "3");

    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-description-list__text")
      .should("contain", "group-a")
      .should("contain", "group-b")
      .should("contain", "group-c");
  });
});
