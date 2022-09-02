/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { TagTypePage } from "../../../models/tag-type";

describe("Delete tag", () => {
  const tagTypePage = new TagTypePage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "TagType");

      let tagType;

      cy.log("")
        .then(() => {
          // Create tagType
          return cy
            .api_crud(tokens, "TagType", "POST", { name: "type-a" })
            .then((responseData) => (tagType = responseData));
        })
        .then(() => {
          // Tags to edit
          return [...Array(4)]
            .map((_, i) => ({
              name: `tag-${(i + 10).toString(36)}`,
              tagType: tagType,
            }))
            .forEach((payload) => {
              cy.api_crud(tokens, "Tag", "POST", payload);
            });
        });
    });
  });

  it("Delete", () => {
    tagTypePage.deleteTag(0, 0);

    // Verify table
    cy.get(".pf-c-table__expandable-row-content > div > .pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("not.contain", "tag-a");
  });
});
