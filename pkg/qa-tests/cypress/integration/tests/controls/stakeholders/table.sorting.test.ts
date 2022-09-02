/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { StakeholderPage } from "../../../models/stakeholder";

describe("Sort stakeholder", () => {
  const stakeholder = new StakeholderPage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data
    const stakeholderGroups = [];
    const jobFunctions = [];

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "Stakeholder");
      cy.api_clean(tokens, "StakeholderGroup");
      cy.api_clean(tokens, "JobFunction");

      cy.log("")
        .then(() => {
          // Create stakeholder groups
          return [...Array(11)]
            .map((_, i) => ({
              name: `group-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(
                tokens,
                "StakeholderGroup",
                "POST",
                payload
              ).then((data) => stakeholderGroups.push(data));
            });
        })
        .then(() => {
          // Create job functions
          return [...Array(11)]
            .map((_, i) => ({
              role: `function-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "JobFunction", "POST", payload).then((data) =>
                jobFunctions.push(data)
              );
            });
        })
        .then(() => {
          // Create stakeholders
          return [...Array(11)]
            .map((_, i) => ({
              email: `email-${(i + 10).toString(36)}@domain.com`,
              displayName: `stakeholder-${(i + 10).toString(36)}`,
              stakeholderGroups: stakeholderGroups.slice(0, i),
              jobFunction: jobFunctions[i],
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
  });

  it("Sort by email", () => {
    const columnName = "Email";
    stakeholder.openPage();

    // Asc is the default
    cy.get(".pf-c-table").pf4_table_column_isAsc(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("email-a@domain.com");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("email-j@domain.com");

    // Desc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("email-k@domain.com");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("email-b@domain.com");
  });

  it("Sort by displayName", () => {
    const columnName = "Display name";
    stakeholder.openPage();

    // Asc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("stakeholder-j");

    // Desc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("stakeholder-b");
  });

  it("Sort by job function", () => {
    const columnName = "Job function";
    stakeholder.openPage();

    // Asc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("stakeholder-j");

    // Desc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("stakeholder-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("stakeholder-b");
  });

  it("Sort by groups", () => {
    const columnName = "Group count";
    stakeholder.openPage();

    // Asc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("0");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("9");

    // Desc
    stakeholder.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("10");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("1");
  });
});
