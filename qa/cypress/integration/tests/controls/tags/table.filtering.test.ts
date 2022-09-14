/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { TagTypePage } from "../../../models/tag-type";

describe("Filter tagtypes", () => {
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
          // Create tagTypes
          return [...Array(11)]
            .map((_, i) => ({
              name: `type-${(i + 10).toString(36)}`,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "TagType", "POST", payload).then((data) => {
                tagTypes.push(data);
              });
            });
        })
        .then(() => {
          // Create tags
          return [...Array(11)]
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

  it("By tagType", () => {
    const filterIndex = 0;
    tagTypePage.openPage();

    // First filter
    tagTypePage.applyFilter(filterIndex, "type-a");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");

    // Second filter
    tagTypePage.applyFilter(filterIndex, "type-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("type-k");
  });

  it("By tag", () => {
    const filterIndex = 1;
    tagTypePage.openPage();

    // First filter
    tagTypePage.applyFilter(filterIndex, "tag-a");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");

    // Second filter
    tagTypePage.applyFilter(filterIndex, "tag-k");

    cy.get(".pf-c-table").pf4_table_rows().eq(0).contains("type-a");
    cy.get(".pf-c-table").pf4_table_rows().eq(1).contains("type-k");
  });
});
