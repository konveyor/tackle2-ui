/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { TagTypePage } from "../../../models/tag-type";

describe("Sort tagtypes", () => {
  const tagTypePage = new TagTypePage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    // Data

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "TagType");

      const tagTypes = [];

      cy.log("")
        .then(() => {
          // Create tag types
          return [...Array(11)]
            .map((_, i) => ({
              name: `type-${(i + 10).toString(36)}`,
              rank: i,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "TagType", "POST", payload).then((data) => {
                tagTypes.push(data);
              });
            });
        })
        .then(() => {
          // Create tags
          return [...Array(10)]
            .map((_, i) => ({
              name: `tag-${(i + 10).toString(36)}`,
              tagType: tagTypes[i],
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Tag", "POST", payload);
            });
        });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("Sort by name", () => {
    const columnName = "Tag type";
    tagTypePage.openPage();

    // Asc is the default
    cy.get(".pf-c-table").pf4_table_column_isAsc(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("type-j");

    // Desc
    tagTypePage.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("type-b");
  });

  it("Sort by rank", () => {
    const columnName = "Rank";
    tagTypePage.openPage();

    // Asc
    tagTypePage.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("type-j");

    // Desc
    tagTypePage.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("type-b");
  });

  it("Sort by tags", () => {
    const columnName = "Tag count";
    tagTypePage.openPage();

    // Asc
    tagTypePage.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-k");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("type-j");

    // Desc
    tagTypePage.toggleSortBy(columnName);

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(9).contains("type-j");
  });
});
