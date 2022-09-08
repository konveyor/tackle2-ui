/// <reference types="cypress" />
/// <reference types="cypress-keycloak-commands" />

import { TagTypePage } from "../../../models/tag-type";

describe("Create new tag type", () => {
  const tagType = new TagTypePage();

  beforeEach(() => {
    cy.kcLogout();
    cy.kcLogin("alice").as("tokens");

    cy.get<KcTokens>("@tokens").then((tokens) => {
      cy.api_clean(tokens, "TagType");
    });
  });

  it("With min data", () => {
    tagType.createTagType({
      name: "myTagType",
      rank: 3,
      color: "Blue",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag type']")
      .should("contain", "myTagType");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Rank']")
      .should("contain", "3");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Color']")
      .should("contain", "Blue");
  });

  it("With rank", () => {
    tagType.createTagType({
      name: "myTagType",
      rank: 5,
      color: "Blue",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag type']")
      .should("contain", "myTagType");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Rank']")
      .should("contain", "5");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Color']")
      .should("contain", "Blue");
  });

  it("With color", () => {
    tagType.createTagType({
      name: "myTagType",
      rank: 3,
      color: "Blue",
    });

    // Verify table
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Tag type']")
      .should("contain", "myTagType");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Rank']")
      .should("contain", "3");
    cy.get(".pf-c-table")
      .pf4_table_rows()
      .eq(0)
      .find("td[data-label='Color']")
      .should("contain", "Blue");
  });
});
