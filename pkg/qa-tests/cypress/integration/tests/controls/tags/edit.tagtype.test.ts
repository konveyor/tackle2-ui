/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { TagTypePage } from "../../../models/tag-type";

describe("Edit tag type", () => {
  const tagType = new TagTypePage();

  before(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "TagType");

      // Tag type to edit
      cy.api_crud(tokens, "TagType", "POST", {
        name: "aaa",
        rank: 111,
        colour: `#fff`,
      });
    });
  });

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");
  });

  it("Name and rank", () => {
    tagType.editTagType(0, {
      name: "newName",
      rank: 222,
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newName")
      .should("contain", "222");
  });

  it("Color", () => {
    tagType.editTagType(0, {
      name: "newName",
      rank: 10,
      color: "Red",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .should("contain", "newName")
      .should("contain", "10")
      .should("contain", "Red");
  });
});
