/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { StakeholderGroupPage } from "../../../models/stakeholder-group";

describe("Edit stakeholder group", () => {
  const stakeholderGroupPage = new StakeholderGroupPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_clean(tokens, "StakeholderGroup");

      const stakeholders = [];

      cy.log("")
        .then(() => {
          // Stakeholders for dropdown
          return [...Array(3)]
            .map((_, i) => ({
              email: `email-${(i + 10).toString(36)}@domain.com`,
              displayName: `stakeholder-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Stakeholder", "POST", payload).then(
                (responseData) => {
                  stakeholders.push(responseData);
                }
              );
            });
        })
        .then(() => {
          // Stakeholder group to edit
          return cy.api_crud(tokens, "StakeholderGroup", "POST", {
            name: "group-a",
            stakeholders: stakeholders.slice(0, 1),
          });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("Name and description", () => {
    stakeholderGroupPage.edit(0, {
      name: "newName",
      description: "newDescription",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newName")
      .should("contain", "newDescription");
  });

  it("Members", () => {
    stakeholderGroupPage.edit(0, {
      name: "newName",
      members: ["stakeholder-b", "stakeholder-c"],
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newName")
      .should("contain", "3");

    cy.get(".pf-c-table").pf4_table_row_expand(0);
    cy.get(".pf-c-table > tbody > tr.pf-c-table__expandable-row")
      .find(".pf-c-description-list .pf-c-description-list__text")
      .should("contain", "stakeholder-a")
      .should("contain", "stakeholder-b")
      .should("contain", "stakeholder-c");
  });
});
